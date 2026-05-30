import jsPDF from 'jspdf';
import { format } from 'date-fns';

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  detail?: string;
  products: {
    name: string;
    category: string;
    points: number;
  };
}

export interface Order {
  id: string;
  order_number: number;
  total: number;
  created_at: string;
  order_items: OrderItem[];
}

/**
 * Genera un jsPDF en formato [164×600] idéntico al backend
 */
export function generatePDF(
  order: Order,
  items: OrderItem[],
  title: string,
): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: [164, 600] });
  const pageWidth = doc.internal.pageSize.width;
  const centerX = pageWidth / 2;
  const margin = 10;

  let yPos = 10;
  doc.setFont('Courier');

  // logo
  doc.addImage(
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-KloLHRepjExrJHt918Q2VWb4HdWvmT.png',
    'PNG',
    margin,
    yPos,
    pageWidth - margin * 2,
    25,
    undefined,
    'FAST',
  );
  yPos += 35;

  // header
  doc.setFontSize(14);
  doc.text(`PEDIDO #${order.order_number}`, centerX, yPos, { align: 'center' });
  yPos += 20;
  doc.text(title, centerX, yPos, { align: 'center' });
  yPos += 20;

  // fecha
  doc.setFontSize(10);
  const dateStr = format(new Date(order.created_at), 'dd/MM/yyyy HH:mm');
  doc.text(`Fecha: ${dateStr}`, centerX, yPos, { align: 'center' });
  yPos += 15;

  // separador
  const sep = '*'.repeat(20);
  doc.text(sep, centerX, yPos, { align: 'center' });
  yPos += 15;

  // items
  doc.setFontSize(10);
  const maxWidth = pageWidth - margin * 2 - 40;

  items.forEach((item) => {
    const text = `${item.quantity}x ${item.products.name}`;
    if (doc.getTextWidth(text) > maxWidth) {
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line: string) => {
        if (yPos > 570) {
          doc.addPage();
          yPos = 10;
        }
        doc.text(line, margin, yPos);
        yPos += 12;
      });
    } else {
      if (yPos > 570) {
        doc.addPage();
        yPos = 10;
      }
      doc.text(text, margin, yPos);
    }

    const price = `$${item.price.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`;
    doc.text(price, pageWidth - margin, yPos, { align: 'right' });
    yPos += 20;
  });

  return doc;
}

/**
 * Calcula la altura necesaria para el PDF
 */
function calculatePDFHeight(items: OrderItem[]): number {
  let height = 85; // header: margin + title + order# + date + pago + separator

  items.forEach((item) => {
    const nameLength = item.products.name.length;
    height += nameLength > 18 ? 36 : 23;
    if (item.detail) height += 14;
  });

  height += 20; // total line
  height += 15; // bottom margin

  return Math.max(height, 150);
}

/**
 * Genera un único PDF con todos los items en lista plana
 */
export function generateSinglePDF(order: Order, _title: string, metodoPago?: 'efectivo' | 'tarjeta'): jsPDF {
  const pdfHeight = calculatePDFHeight(order.order_items);
  const doc = new jsPDF({ unit: 'pt', format: [164, pdfHeight] });
  const pageWidth = doc.internal.pageSize.width;
  const centerX = pageWidth / 2;
  const margin = 10;

  let yPos = 14;
  doc.setFont('Courier');

  doc.setFontSize(18);
  doc.text('DOBLE CHEVRON', centerX, yPos, { align: 'center' });
  yPos += 20;

  doc.setFontSize(12);
  doc.text(`Pedido #${order.order_number}`, centerX, yPos, { align: 'center' });
  yPos += 15;

  doc.setFontSize(11);
  const dateStr = format(new Date(order.created_at), 'dd/MM/yyyy HH:mm');
  doc.text(`Fecha: ${dateStr}`, centerX, yPos, { align: 'center' });
  yPos += 13;

  if (metodoPago) {
    const pagoText = metodoPago === 'efectivo' ? 'EFECTIVO' : 'TARJETA';
    doc.text(`Pago: ${pagoText}`, centerX, yPos, { align: 'center' });
    yPos += 14;
  }

  doc.text('-'.repeat(22), centerX, yPos, { align: 'center' });
  yPos += 15;

  const maxWidth = pageWidth - margin * 2 - 40;

  doc.setFontSize(11);
  order.order_items.forEach((item) => {
    const text = `${item.quantity}x ${item.products.name}`;
    if (doc.getTextWidth(text) > maxWidth) {
      const lines = doc.splitTextToSize(text, maxWidth) as string[];
      lines.forEach((line, lineIdx) => {
        doc.text(line, margin, yPos);
        if (lineIdx < lines.length - 1) yPos += 13;
      });
    } else {
      doc.text(text, margin, yPos);
    }
    const price = `$${item.price.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`;
    doc.text(price, pageWidth - margin, yPos, { align: 'right' });
    yPos += 14;
    if (item.detail) {
      doc.setFontSize(11);
      doc.text(`  * ${item.detail}`, margin + 4, yPos);
      yPos += 14;
    }
    yPos += 9;
  });

  yPos += 4;
  doc.text('-'.repeat(22), centerX, yPos, { align: 'center' });
  yPos += 13;

  doc.setFontSize(13);
  doc.text(`TOTAL  $${order.total.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`, centerX, yPos, { align: 'center' });

  return doc;
}
