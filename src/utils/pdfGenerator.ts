import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Order, StoreSettings } from '../types/dairy.js';
import { formatCurrency } from './pricing.ts';

export function downloadInvoicePDF(order: Order, settings: StoreSettings): boolean {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Header Background Accent Bar (Warm Dark Brown #6F4E37)
    doc.setFillColor(111, 78, 55);
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Brand Name & Tagline
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(settings.brandName || 'PureDrop Dairy', margin, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(232, 221, 208);
    doc.text(settings.tagline || 'Farm-Fresh Purity, Delivered Daily to Your Doorstep', margin, 18);

    // Document Title on Top Right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('DELIVERY INVOICE', pageWidth - margin, 13, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(244, 235, 225);
    const invoiceNum = `INV-${order.orderNumber.replace(/[^0-9]/g, '') || order.id.slice(-5)}`;
    doc.text(`Invoice #: ${invoiceNum}`, pageWidth - margin, 19, { align: 'right' });
    doc.text(
      `Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}`,
      pageWidth - margin,
      24,
      { align: 'right' }
    );

    // Store Contact & Depot Info (Left Side below banner)
    let currentY = 36;
    doc.setTextColor(53, 39, 31); // Dark Espresso
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Dairy Farm Depot & Dispatch Center:', margin, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 60, 50);
    doc.text(`${settings.address}, ${settings.city}`, margin, currentY + 5);
    doc.text(`Phone: ${settings.phone} | Email: ${settings.email}`, margin, currentY + 10);
    doc.text(`Delivery Slot: ${order.deliverySlot}`, margin, currentY + 15);

    // Customer & Shipping Info (Right Side)
    const rightColX = pageWidth / 2 + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(53, 39, 31);
    doc.text('Bill & Deliver To:', rightColX, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 60, 50);
    doc.text(order.customer.name, rightColX, currentY + 5);
    doc.text(`Phone: +91 ${order.customer.phone}`, rightColX, currentY + 10);
    const splitAddr = doc.splitTextToSize(
      `${order.customer.address}, ${order.customer.city} - ${order.customer.pincode}`,
      pageWidth - rightColX - margin
    );
    doc.text(splitAddr, rightColX, currentY + 15);

    if (order.customer.deliveryNotes) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(111, 78, 55);
      doc.text(`Doorstep Note: ${order.customer.deliveryNotes}`, rightColX, currentY + 22);
    }

    currentY += 30;

    // Items Table using autoTable
    const tableRows = order.items.map((item, index) => [
      String(index + 1),
      item.name,
      item.variantName || item.unit,
      `INR ${item.unitPrice.toLocaleString('en-IN')}`,
      String(item.quantity),
      `INR ${item.totalPrice.toLocaleString('en-IN')}`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Item Description', 'Pack Size', 'Unit Price', 'Qty', 'Line Total']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [111, 78, 55], // #6F4E37
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8.5,
        textColor: [53, 39, 31],
        lineColor: [232, 221, 208],
        lineWidth: 0.2,
      },
      alternateRowStyles: {
        fillColor: [251, 247, 240], // Warm Cream
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 35 },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 16, halign: 'center' },
        5: { cellWidth: 30, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || currentY + 40;

    // Totals Box (Right Aligned)
    const summaryWidth = 75;
    const summaryX = pageWidth - margin - summaryWidth;
    let sumY = finalY + 6;

    doc.setFillColor(251, 247, 240);
    doc.setDrawColor(232, 221, 208);
    doc.roundedRect(summaryX, sumY, summaryWidth, 34, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 60, 50);

    doc.text('Subtotal:', summaryX + 4, sumY + 6);
    doc.text(`INR ${order.subtotal.toLocaleString('en-IN')}`, pageWidth - margin - 4, sumY + 6, {
      align: 'right',
    });

    if (order.discount > 0) {
      doc.setTextColor(111, 78, 55);
      doc.text(`Discount (${order.couponCode || 'Promo'}):`, summaryX + 4, sumY + 12);
      doc.text(`-INR ${order.discount.toLocaleString('en-IN')}`, pageWidth - margin - 4, sumY + 12, {
        align: 'right',
      });
      doc.setTextColor(80, 60, 50);
    } else {
      doc.text('Discount:', summaryX + 4, sumY + 12);
      doc.text('INR 0', pageWidth - margin - 4, sumY + 12, { align: 'right' });
    }

    doc.text('Doorstep Delivery:', summaryX + 4, sumY + 18);
    doc.text(
      order.deliveryFee === 0 ? 'FREE' : `INR ${order.deliveryFee.toLocaleString('en-IN')}`,
      pageWidth - margin - 4,
      sumY + 18,
      { align: 'right' }
    );

    // Total Amount Row
    doc.setDrawColor(200, 180, 160);
    doc.line(summaryX + 4, sumY + 22, pageWidth - margin - 4, sumY + 22);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(53, 39, 31);
    doc.text('Total Payable:', summaryX + 4, sumY + 28);
    doc.text(`INR ${order.total.toLocaleString('en-IN')}`, pageWidth - margin - 4, sumY + 28, {
      align: 'right',
    });

    // Payment Information Box on the Left
    const payBoxWidth = pageWidth - margin * 2 - summaryWidth - 10;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(232, 221, 208);
    doc.roundedRect(margin, sumY, payBoxWidth, 34, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(53, 39, 31);
    doc.text('Payment Information & Status:', margin + 4, sumY + 5.5);

    const formatPaymentMethodName = (m: string) => {
      if (m === 'cod') return 'Cash on Delivery (Doorstep Cash)';
      if (m === 'upi') return 'UPI Payment (PhonePe/GPay)';
      if (m === 'qr_code') return 'QR Code Payment';
      if (m === 'net_banking') return 'Net Banking (Online Transfer)';
      if (m === 'bank_transfer') return 'Direct Bank Transfer (IMPS/NEFT)';
      if (m === 'gateway' || m === 'card') return 'Online Payment Gateway';
      return m ? m.toUpperCase() : 'N/A';
    };

    const statusBadge = order.paymentStatus === 'paid'
      ? 'PAID (Verified)'
      : order.paymentStatus === 'partially_paid'
      ? 'PARTIALLY PAID'
      : order.paymentStatus === 'refunded'
      ? 'REFUNDED'
      : 'PENDING (Collect on Delivery)';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 60, 50);
    doc.text(`Payment Mode: ${formatPaymentMethodName(order.paymentMethod)}`, margin + 4, sumY + 11);
    doc.text(`Payment Status: ${statusBadge}`, margin + 4, sumY + 16);
    doc.text(
      `Amount Paid: INR ${(order.amountPaid || 0).toLocaleString('en-IN')}  |  Remaining Balance: INR ${(typeof order.remainingBalance === 'number' ? order.remainingBalance : (order.paymentStatus === 'paid' ? 0 : order.total)).toLocaleString('en-IN')}`,
      margin + 4,
      sumY + 21
    );
    if (order.transactionId) {
      doc.text(`Transaction / UTR Ref: ${order.transactionId}`, margin + 4, sumY + 26);
    } else {
      doc.text(`Current Order Status: ${order.status}`, margin + 4, sumY + 26);
    }

    // Footer Thank You Note
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFillColor(244, 235, 225);
    doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(111, 78, 55);
    doc.text(
      'Thank you for choosing pure, ethically harvested dairy! For assistance, WhatsApp ' +
        settings.phone,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );

    // Save and download
    doc.save(`Invoice-${order.orderNumber}.pdf`);
    return true;
  } catch (error) {
    console.error('Failed to generate Invoice PDF:', error);
    return false;
  }
}

export function downloadOrderDetailsPDF(order: Order, settings: StoreSettings, isStaffView = true): boolean {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Header Background
    doc.setFillColor(139, 101, 72); // Milk Chocolate Brown #8B6548
    doc.rect(0, 0, pageWidth, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`${settings.brandName || 'PureDrop Dairy'} - Order Details`, margin, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Order #${order.orderNumber} • Dispatch Manifest`, margin, 18);

    doc.text(
      `Printed: ${new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}`,
      pageWidth - margin,
      14,
      { align: 'right' }
    );

    let currentY = 32;

    // Customer & Fulfillment details
    doc.setTextColor(53, 39, 31);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Fulfillment & Customer Details:', margin, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 60, 50);
    doc.text(`Customer: ${order.customer.name}`, margin, currentY + 5);
    doc.text(`Mobile: +91 ${order.customer.phone}`, margin, currentY + 10);
    doc.text(`Delivery Slot: ${order.deliverySlot}`, margin, currentY + 15);

    const rightX = pageWidth / 2 + 5;
    doc.text(`Address: ${order.customer.address}`, rightX, currentY + 5);
    doc.text(`City: ${order.customer.city} - PIN: ${order.customer.pincode}`, rightX, currentY + 10);
    if (order.customer.deliveryNotes) {
      doc.text(`Doorstep Note: ${order.customer.deliveryNotes}`, rightX, currentY + 15);
    }

    currentY += 24;

    // Items list
    const itemsData = order.items.map((it, i) => [
      String(i + 1),
      it.name,
      it.variantName || it.unit,
      String(it.quantity),
      `INR ${it.unitPrice.toLocaleString('en-IN')}`,
      `INR ${it.totalPrice.toLocaleString('en-IN')}`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Product', 'Size / Variant', 'Quantity', 'Unit Rate', 'Total']],
      body: itemsData,
      theme: 'grid',
      headStyles: {
        fillColor: [139, 101, 72],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8.5,
        textColor: [53, 39, 31],
        lineColor: [232, 221, 208],
      },
      alternateRowStyles: {
        fillColor: [251, 247, 240],
      },
      margin: { left: margin, right: margin },
    });

    let nextY = (doc as any).lastAutoTable?.finalY + 8;

    // Financial breakdown
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(53, 39, 31);
    doc.text(
      `Total Payable: INR ${order.total.toLocaleString('en-IN')} (${order.paymentMethod.toUpperCase()} - ${order.paymentStatus.toUpperCase()})`,
      margin,
      nextY
    );

    nextY += 8;

    // Internal notes (only if authorized staff view)
    if (isStaffView && order.internalNotes) {
      doc.setFillColor(254, 243, 199);
      doc.roundedRect(margin, nextY, pageWidth - margin * 2, 14, 2, 2, 'FD');
      doc.setTextColor(146, 64, 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('Internal Staff Notes:', margin + 4, nextY + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(order.internalNotes, margin + 4, nextY + 10);
      nextY += 18;
    }

    // Status Timeline summary
    if (order.statusHistory && order.statusHistory.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(53, 39, 31);
      doc.text('Status Audit History:', margin, nextY);
      nextY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 80, 70);
      for (const h of order.statusHistory) {
        const timeStr = new Date(h.timestamp).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
        doc.text(`• [${timeStr}] ${h.status}: ${h.note || ''}`, margin + 2, nextY);
        nextY += 4.5;
      }
    }

    doc.save(`Order-${order.orderNumber}.pdf`);
    return true;
  } catch (err) {
    console.error('Failed to generate Order Details PDF:', err);
    return false;
  }
}
