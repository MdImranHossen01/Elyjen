import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import { validatePayment } from '@/lib/sslcommerz';

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const data = Object.fromEntries(body.entries());

    // Verify Payment with SSLCommerz IPN
    const response = await validatePayment(data);

    if (response?.status === 'VALID' || response?.status === 'VALIDATED') {
      const tran_id = data.tran_id?.toString();
      
      await connectToDatabase();
      const { getTenantDomain } = await import('@/lib/tenant');
      const domain = await getTenantDomain();
      const order = await Order.findOne({ transactionId: tran_id, domain });

      if (order && order.paymentStatus !== 'Paid') {
        order.paymentStatus = 'Paid';
        order.status = 'Confirmed';
        await order.save();

        try {
          const { logOrderPaymentToLedgerIdempotent } = await import('@/lib/ledgerHelper');
          await logOrderPaymentToLedgerIdempotent(order);
        } catch (ledgerErr) {
          console.error('Error logging payment to ledger on IPN, queueing outbox:', ledgerErr);
          try {
            const { queueOutboxTask, processPendingOutboxTasks } = await import('@/lib/ledgerHelper');
            await queueOutboxTask('ORDER_PAYMENT', { orderId: order._id.toString() });
            processPendingOutboxTasks().catch(err => console.error('[Ledger] Outbox processing error:', err));
          } catch (queueErr) {
            console.error('Failed to queue outbox task for IPN order payment:', queueErr);
          }
        }
      }
    }

    return NextResponse.json({ message: 'IPN Received' });
  } catch (error) {
    console.error('Payment IPN Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

