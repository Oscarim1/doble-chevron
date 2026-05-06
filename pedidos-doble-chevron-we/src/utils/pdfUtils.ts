import jsPDF from 'jspdf';
import { format } from 'date-fns';

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
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
 * Categoriza los items del pedido
 */
function categorizeItems(items: OrderItem[]) {
  const dobleChevron: OrderItem[] = [];
  const papas: OrderItem[] = [];
  const bebidas: OrderItem[] = [];
  const otros: OrderItem[] = [];

  items.forEach((item) => {
    const category = item.products.category.toLowerCase();
    if (category.includes('dobleChevron')) {
      dobleChevron.push(item);
    } else if (category.includes('papas')) {
      papas.push(item);
    } else if (category.includes('bebidas')) {
      bebidas.push(item);
    } else {
      otros.push(item);
    }
  });

  return { dobleChevron, papas, bebidas, otros };
}

/**
 * Calcula la altura necesaria para el PDF
 */
function calculatePDFHeight(order: Order): number {
  const { dobleChevron, papas, bebidas, otros } = categorizeItems(order.order_items);

  let height = 10; // margen inicial
  height += 35; // logo
  height += 12; // fecha
  height += 15; // método de pago
  height += 15; // separador

  // Estimar altura por item (considerar nombres largos que pueden ser multi-línea)
  const countItemsHeight = (items: OrderItem[]) => {
    return items.reduce((acc, item) => {
      const nameLength = item.products.name.length;
      // Si el nombre es largo (>15 chars), asumimos 2 líneas
      const lines = nameLength > 15 ? 2 : 1;
      return acc + (lines === 1 ? 22 : 34);
    }, 0);
  };

  const sectionHeader = 15;
  const cutLine = 28; // línea punteada (10) + espaciado (18)
  const logoHeight = 40; // logo adicional antes de papas

  // Secciones activas
  const sections = [dobleChevron, papas, bebidas, otros].filter(s => s.length > 0);

  sections.forEach((section, index) => {
    height += sectionHeader; // título de sección
    height += countItemsHeight(section); // items (con estimación de multi-línea)
    if (index < sections.length - 1) {
      height += cutLine; // línea de corte (excepto después de la última)
    }
  });

  // Logo adicional antes de papas (si hay dobleChevron y papas)
  if (dobleChevron.length > 0 && papas.length > 0) {
    height += logoHeight;
  }

  height += 15; // margen final

  return Math.max(height, 150); // mínimo 150pt
}

/**
 * Genera un único PDF con todas las categorías separadas por líneas de corte
 */
export function generateSinglePDF(order: Order, _title: string, metodoPago?: 'efectivo' | 'tarjeta'): jsPDF {
  const pdfHeight = calculatePDFHeight(order);
  const doc = new jsPDF({ unit: 'pt', format: [164, pdfHeight] });
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

  // fecha
  doc.setFontSize(10);
  const dateStr = format(new Date(order.created_at), 'dd/MM/yyyy HH:mm');
  doc.text(`Fecha: ${dateStr}`, centerX, yPos, { align: 'center' });
  yPos += 12;

  // método de pago
  if (metodoPago) {
    const pagoText = metodoPago === 'efectivo' ? 'EFECTIVO' : 'TARJETA';
    doc.text(`Pago: ${pagoText}`, centerX, yPos, { align: 'center' });
    yPos += 15;
  } else {
    yPos += 3;
  }

  // separador inicial
  const sep = '*'.repeat(20);
  doc.text(sep, centerX, yPos, { align: 'center' });
  yPos += 15;

  const maxWidth = pageWidth - margin * 2 - 40;
  const { dobleChevron, papas, bebidas, otros } = categorizeItems(order.order_items);

  // Función auxiliar para renderizar items de una sección
  const renderItems = (items: OrderItem[], isLastSection: boolean, isLastItem: (idx: number) => boolean) => {
    items.forEach((item, idx) => {
      const text = `${item.quantity}x ${item.products.name}`;
      if (doc.getTextWidth(text) > maxWidth) {
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line: string, lineIdx: number) => {
          doc.text(line, margin, yPos);
          // Solo agregar espacio entre líneas del mismo item
          if (lineIdx < lines.length - 1) {
            yPos += 12;
          }
        });
      } else {
        doc.text(text, margin, yPos);
      }

      const price = `$${item.price.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`;
      doc.text(price, pageWidth - margin, yPos, { align: 'right' });

      // Menos espacio después del último item de la última sección
      if (isLastSection && isLastItem(idx)) {
        yPos += 5;
      } else {
        yPos += 22;
      }
    });
  };

  // Función para renderizar línea de corte (solo línea punteada)
  const renderCutLine = () => {
    yPos += 10;
    doc.setLineDashPattern([3, 3], 0);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    doc.setLineDashPattern([], 0);
    yPos += 18;
  };

  // Determinar cuál es la última sección con items
  const hasOtros = otros.length > 0;
  const hasBebidas = bebidas.length > 0;
  const hasPapas = papas.length > 0;
  const hasDobleChevron = dobleChevron.length > 0;

  const isLastSection = (section: 'dobleChevron' | 'papas' | 'bebidas' | 'otros') => {
    if (section === 'otros') return hasOtros;
    if (section === 'bebidas') return !hasOtros && hasBebidas;
    if (section === 'papas') return !hasOtros && !hasBebidas && hasPapas;
    return !hasOtros && !hasBebidas && !hasPapas && hasDobleChevron;
  };

  // Sección Doble Chevron
  if (hasDobleChevron) {
    doc.setFontSize(12);
    doc.text('CHURROS', centerX, yPos, { align: 'center' });
    yPos += 15;
    doc.setFontSize(10);
    renderItems(dobleChevron, isLastSection('dobleChevron'), (idx) => idx === dobleChevron.length - 1);
  }

  // Línea de corte después de dobleChevron (si hay más secciones después)
  if (hasDobleChevron && (hasPapas || hasBebidas || hasOtros)) {
    renderCutLine();
  }

  // Sección Papas (con logo si hay dobleChevron antes)
  if (hasPapas) {
    // Añadir logo antes de papas si hubo dobleChevron
    if (hasDobleChevron) {
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
    }
    doc.setFontSize(12);
    doc.text('PAPAS FRITAS', centerX, yPos, { align: 'center' });
    yPos += 15;
    doc.setFontSize(10);
    renderItems(papas, isLastSection('papas'), (idx) => idx === papas.length - 1);
  }

  // Línea de corte después de papas (si hay más secciones después)
  if (hasPapas && (hasBebidas || hasOtros)) {
    renderCutLine();
  }

  // Sección Bebidas
  if (hasBebidas) {
    doc.setFontSize(12);
    doc.text('BEBIDAS', centerX, yPos, { align: 'center' });
    yPos += 15;
    doc.setFontSize(10);
    renderItems(bebidas, isLastSection('bebidas'), (idx) => idx === bebidas.length - 1);
  }

  // Línea de corte después de bebidas (si hay otros)
  if (hasBebidas && hasOtros) {
    renderCutLine();
  }

  // Sección Otros
  if (hasOtros) {
    doc.setFontSize(12);
    doc.text('OTROS', centerX, yPos, { align: 'center' });
    yPos += 15;
    doc.setFontSize(10);
    renderItems(otros, true, (idx) => idx === otros.length - 1);
  }

  return doc;
}
