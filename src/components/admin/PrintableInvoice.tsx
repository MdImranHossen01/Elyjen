'use client';

import React from 'react';
import { format } from 'date-fns';

interface InvoiceProps {
  order: any;
}

const PrintableInvoice: React.FC<InvoiceProps> = ({ order }) => {
  if (!order) return null;

  return (
    <div className="bg-white p-8 text-black print:p-0 w-full max-w-4xl mx-auto border print:border-none my-8 print:my-0 shadow-sm print:shadow-none font-sans">
      {/* Header */}
      <div className="flex justify-between items-start border-b pb-8 mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-primary mb-2">ELYJEN<span className="text-orange-500">SHOP</span></h1>
          <div className="text-sm text-gray-500 space-y-1">
            <p>House: 12, Road: 05, Sector: 10</p>
            <p>Uttara, Dhaka-1230, Bangladesh</p>
            <p>Phone: +880 1234 567890</p>
            <p>Email: support@bddukan.shop</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold uppercase tracking-widest text-gray-400 mb-4">INVOICE</h2>
          <div className="space-y-1">
            <p className="font-bold">Order ID: <span className="text-primary">#{String(order._id || '').toUpperCase()}</span></p>
            <p>Date: {order.createdAt ? format(new Date(order.createdAt), 'dd MMMM, yyyy') : 'N/A'}</p>
            <p className="capitalize">Status: <span className="font-semibold">{order.status}</span></p>
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 border-b pb-1">Billing Details</h3>
          <div className="space-y-1">
            <p className="font-bold text-lg">{order.shippingAddress?.fullName || order.user?.name || 'Customer'}</p>
            <p>{order.user?.email || ''}</p>
            <p>{order.shippingAddress?.phone || ''}</p>
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 border-b pb-1">Shipping Address</h3>
          <div className="space-y-1 text-sm italic">
            <p>{order.shippingAddress?.street || ''}</p>
            <p>{[order.shippingAddress?.city, order.shippingAddress?.state].filter(Boolean).join(', ')}</p>
            <p>{order.shippingAddress?.zipCode || ''}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-12">
        <thead>
          <tr className="border-b-2 border-black text-left text-sm uppercase font-bold">
            <th className="py-4">Product Description</th>
            <th className="py-4 text-center">Price</th>
            <th className="py-4 text-center">Qty</th>
            <th className="py-4 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {order.items?.map((item: any, index: number) => (
            <tr key={index} className="text-sm">
              <td className="py-4">
                <p className="font-bold">{item.name}</p>
                {item.color && <span className="text-xs text-gray-500 mr-2">Color: {item.color}</span>}
                {item.size && <span className="text-xs text-gray-500">Size: {item.size}</span>}
              </td>
              <td className="py-4 text-center">৳{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="py-4 text-center">{item.quantity}</td>
              <td className="py-4 text-right font-bold">৳{(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64 space-y-3">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>৳{order.totalAmount - (order.deliveryCharge || 0) + (order.couponDiscountAmount || 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping Cost</span>
            <span>৳{order.deliveryCharge || 0}</span>
          </div>
          {order.couponDiscountAmount > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Discount</span>
              <span>-৳{order.couponDiscountAmount}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-black border-t-2 border-black pt-3">
            <span>TOTAL</span>
            <span className="text-primary">৳{Math.round(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-24 border-t pt-8 text-center text-xs text-gray-400">
        <p className="mb-2 font-bold text-gray-600">THANK YOU FOR YOUR BUSINESS!</p>
        <p>This is a computer generated invoice and does not require a signature.</p>
        <p>Visit us at: www.bddukan.shop</p>
      </div>
      
      {/* Page break for bulk printing */}
      <div className="print:break-after-page"></div>
    </div>
  );
};

export default PrintableInvoice;

