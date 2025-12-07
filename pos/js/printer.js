/* ============================================
   FIXOLOGY POS - PRINTER MODULE
   ============================================ */

const PRINTER = {
  // Common styles for all print documents
  baseStyles: `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      padding: 20px; 
      color: #333;
      line-height: 1.4;
    }
    .header { 
      text-align: center; 
      border-bottom: 3px solid #5D3FD3; 
      padding-bottom: 15px; 
      margin-bottom: 20px; 
    }
    .header h1 { 
      color: #5D3FD3; 
      font-size: 28px;
      margin-bottom: 5px;
    }
    .header .tagline {
      color: #666;
      font-size: 12px;
    }
    .ticket-info {
      display: flex;
      justify-content: space-between;
      background: #f5f5f5;
      padding: 10px 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .section { 
      margin-bottom: 20px; 
      page-break-inside: avoid;
    }
    .section-title { 
      font-weight: bold; 
      font-size: 14px;
      text-transform: uppercase;
      color: #5D3FD3;
      border-bottom: 1px solid #ddd; 
      padding-bottom: 5px; 
      margin-bottom: 10px; 
    }
    .row { 
      display: flex; 
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px dotted #eee;
    }
    .row:last-child { border-bottom: none; }
    .label { color: #666; }
    .value { font-weight: 500; text-align: right; }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 10px; 
    }
    th, td { 
      padding: 8px 10px; 
      text-align: left; 
      border-bottom: 1px solid #eee; 
    }
    th { 
      background: #f5f5f5; 
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
    }
    .total-row { 
      font-weight: bold; 
      background: #f0f0f0; 
    }
    .total-row td:last-child {
      color: #5D3FD3;
      font-size: 18px;
    }
    .footer { 
      margin-top: 30px; 
      text-align: center; 
      font-size: 12px; 
      color: #666;
      border-top: 1px solid #ddd;
      padding-top: 15px;
    }
    .signature-line {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      width: 45%;
    }
    .signature-box .line {
      border-bottom: 1px solid #333;
      margin-bottom: 5px;
      height: 40px;
    }
    .signature-box .label {
      font-size: 11px;
      text-transform: uppercase;
    }
    .terms {
      margin-top: 20px;
      padding: 10px;
      background: #f9f9f9;
      border-radius: 5px;
      font-size: 10px;
      color: #666;
    }
    .barcode {
      text-align: center;
      margin: 15px 0;
      font-family: 'Libre Barcode 39', monospace;
      font-size: 40px;
    }
    .qr-code {
      text-align: center;
      margin: 15px 0;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  `,

  // Open print window with HTML content
  openPrintWindow: (html, title) => {
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>${PRINTER.baseStyles}</style>
      </head>
      <body>
        ${html}
        <script>
          window.onload = function() {
            window.print();
          };
        <\/script>
      </body>
      </html>
    `);
    win.document.close();
  },

  // Format helpers
  formatCurrency: (amount) => '$' + (amount || 0).toFixed(2),
  
  formatDate: (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  formatTime: (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  },

  // ============================================
  // INTAKE FORM
  // ============================================
  printIntakeForm: (ticket) => {
    const html = `
      <div class="header">
        <h1>FIXOLOGY</h1>
        <div class="tagline">Professional Device Repair</div>
      </div>
      
      <div class="ticket-info">
        <div>
          <strong>Ticket #:</strong> ${ticket.id}
        </div>
        <div>
          <strong>Date:</strong> ${PRINTER.formatDate(ticket.createdAt)}
        </div>
        <div>
          <strong>Time:</strong> ${PRINTER.formatTime(ticket.createdAt)}
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">👤 Customer Information</div>
        <div class="row">
          <span class="label">Name</span>
          <span class="value">${ticket.customer?.name || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Phone</span>
          <span class="value">${ticket.customer?.phone || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Email</span>
          <span class="value">${ticket.customer?.email || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Address</span>
          <span class="value">${ticket.customer?.address || 'N/A'}</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">📱 Device Information</div>
        <div class="row">
          <span class="label">Device Type</span>
          <span class="value">${ticket.device?.type || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Brand / Model</span>
          <span class="value">${ticket.device?.brand || ''} ${ticket.device?.model || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Color</span>
          <span class="value">${ticket.device?.color || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">IMEI / Serial</span>
          <span class="value">${ticket.device?.imei || ticket.device?.serial || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Passcode</span>
          <span class="value">${ticket.device?.passcode || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Condition</span>
          <span class="value">${ticket.device?.condition || 'N/A'}</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">🔧 Issue Description</div>
        <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; font-style: italic;">
          "${ticket.issue?.customerDescription || 'No description provided'}"
        </p>
      </div>
      
      <div class="section">
        <div class="section-title">💰 Estimate</div>
        <table>
          <tr>
            <td>Parts</td>
            <td style="text-align: right;">${PRINTER.formatCurrency(ticket.pricing?.partsCost)}</td>
          </tr>
          <tr>
            <td>Labor</td>
            <td style="text-align: right;">${PRINTER.formatCurrency(ticket.pricing?.laborCost)}</td>
          </tr>
          <tr>
            <td>Tax</td>
            <td style="text-align: right;">${PRINTER.formatCurrency(ticket.pricing?.tax)}</td>
          </tr>
          <tr class="total-row">
            <td>TOTAL ESTIMATE</td>
            <td style="text-align: right;">${PRINTER.formatCurrency(ticket.pricing?.total)}</td>
          </tr>
        </table>
      </div>
      
      <div class="terms">
        <strong>Terms & Conditions:</strong><br>
        1. Repair estimates are subject to change upon diagnosis.<br>
        2. Devices left for 30+ days without pickup may be recycled.<br>
        3. A diagnostic fee may apply if repair is declined.<br>
        4. Warranty covers parts for 90 days, labor for 30 days.<br>
        5. We are not responsible for data loss. Please backup before repair.
      </div>
      
      <div class="signature-line">
        <div class="signature-box">
          <div class="line"></div>
          <div class="label">Customer Signature</div>
        </div>
        <div class="signature-box">
          <div class="line"></div>
          <div class="label">Date</div>
        </div>
      </div>
      
      <div class="footer">
        <p><strong>FIXOLOGY</strong> - Professional Device Repair</p>
        <p>Thank you for choosing us!</p>
        <p style="margin-top: 10px;">Questions? Call (314) 555-0100</p>
      </div>
    `;
    
    PRINTER.openPrintWindow(html, `Intake Form - ${ticket.id}`);
  },

  // ============================================
  // ESTIMATE
  // ============================================
  printEstimate: (ticket) => {
    const subtotal = (ticket.pricing?.laborCost || 0) + (ticket.pricing?.partsCost || 0) - (ticket.pricing?.discount || 0);
    
    const html = `
      <div class="header">
        <h1>FIXOLOGY</h1>
        <div class="tagline">Repair Estimate</div>
      </div>
      
      <div class="ticket-info">
        <div><strong>Estimate #:</strong> ${ticket.id}</div>
        <div><strong>Date:</strong> ${PRINTER.formatDate(new Date())}</div>
      </div>
      
      <div class="section">
        <div class="section-title">Customer</div>
        <p><strong>${ticket.customer?.name || 'N/A'}</strong></p>
        <p>${ticket.customer?.phone || ''}</p>
        <p>${ticket.customer?.email || ''}</p>
      </div>
      
      <div class="section">
        <div class="section-title">Device</div>
        <p><strong>${ticket.device?.brand || ''} ${ticket.device?.model || 'Unknown Device'}</strong></p>
        <p>Issue: ${ticket.issue?.customerDescription || 'N/A'}</p>
      </div>
      
      <div class="section">
        <div class="section-title">Repair Details</div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${ticket.parts && ticket.parts.length > 0 
              ? ticket.parts.map(p => `
                <tr>
                  <td>${p.name}</td>
                  <td style="text-align: right;">${PRINTER.formatCurrency(p.price)}</td>
                </tr>
              `).join('')
              : `<tr><td>Parts</td><td style="text-align: right;">${PRINTER.formatCurrency(ticket.pricing?.partsCost)}</td></tr>`
            }
            <tr>
              <td>Labor</td>
              <td style="text-align: right;">${PRINTER.formatCurrency(ticket.pricing?.laborCost)}</td>
            </tr>
            ${(ticket.pricing?.discount || 0) > 0 ? `
              <tr style="color: green;">
                <td>Discount</td>
                <td style="text-align: right;">-${PRINTER.formatCurrency(ticket.pricing?.discount)}</td>
              </tr>
            ` : ''}
            <tr>
              <td>Subtotal</td>
              <td style="text-align: right;">${PRINTER.formatCurrency(subtotal)}</td>
            </tr>
            <tr>
              <td>Tax (${((ticket.pricing?.taxRate || 0.08) * 100).toFixed(0)}%)</td>
              <td style="text-align: right;">${PRINTER.formatCurrency(ticket.pricing?.tax)}</td>
            </tr>
            <tr class="total-row">
              <td>TOTAL</td>
              <td style="text-align: right;">${PRINTER.formatCurrency(ticket.pricing?.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <p style="text-align: center; margin-top: 20px; color: #666;">
        This estimate is valid for 7 days from the date above.
      </p>
      
      <div class="footer">
        <p><strong>FIXOLOGY</strong></p>
        <p>Questions? Call (314) 555-0100</p>
      </div>
    `;
    
    PRINTER.openPrintWindow(html, `Estimate - ${ticket.id}`);
  },

  // ============================================
  // RECEIPT
  // ============================================
  printReceipt: (ticket) => {
    const html = `
      <div class="header">
        <h1>FIXOLOGY</h1>
        <div class="tagline">Receipt</div>
      </div>
      
      <div class="ticket-info">
        <div><strong>Receipt #:</strong> ${ticket.id}</div>
        <div><strong>Date:</strong> ${PRINTER.formatDate(ticket.pickup?.pickedUpAt || new Date())}</div>
      </div>
      
      <div class="section">
        <div class="section-title">Customer</div>
        <p><strong>${ticket.customer?.name || 'N/A'}</strong></p>
        <p>${ticket.customer?.phone || ''}</p>
      </div>
      
      <div class="section">
        <div class="section-title">Repair Completed</div>
        <p><strong>${ticket.device?.brand || ''} ${ticket.device?.model || 'Device'}</strong></p>
        <p>Repair: ${(ticket.repair?.type || 'repair').replace(/_/g, ' ')}</p>
      </div>
      
      <div class="section">
        <table>
          <tbody>
            <tr>
              <td>Parts</td>
              <td style="text-align: right;">${PRINTER.formatCurrency(ticket.pricing?.partsCost)}</td>
            </tr>
            <tr>
              <td>Labor</td>
              <td style="text-align: right;">${PRINTER.formatCurrency(ticket.pricing?.laborCost)}</td>
            </tr>
            ${(ticket.pricing?.discount || 0) > 0 ? `
              <tr style="color: green;">
                <td>Discount</td>
                <td style="text-align: right;">-${PRINTER.formatCurrency(ticket.pricing?.discount)}</td>
              </tr>
            ` : ''}
            <tr>
              <td>Tax</td>
              <td style="text-align: right;">${PRINTER.formatCurrency(ticket.pricing?.tax)}</td>
            </tr>
            <tr class="total-row">
              <td>TOTAL</td>
              <td style="text-align: right;">${PRINTER.formatCurrency(ticket.pricing?.total)}</td>
            </tr>
            ${(ticket.pricing?.deposit || 0) > 0 ? `
              <tr>
                <td>Deposit Paid</td>
                <td style="text-align: right;">-${PRINTER.formatCurrency(ticket.pricing?.deposit)}</td>
              </tr>
            ` : ''}
            <tr style="background: #e8f5e9;">
              <td><strong>PAID</strong></td>
              <td style="text-align: right;"><strong>${PRINTER.formatCurrency(ticket.pickup?.amountPaid || ticket.pricing?.total)}</strong></td>
            </tr>
          </tbody>
        </table>
        <p style="margin-top: 10px; font-size: 12px; color: #666;">
          Payment Method: ${(ticket.pickup?.paymentMethod || 'Cash').toUpperCase()}
        </p>
      </div>
      
      <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 15px;">
        <strong>Warranty:</strong> Parts 90 days / Labor 30 days
      </div>
      
      <div class="footer">
        <p><strong>Thank you for choosing FIXOLOGY!</strong></p>
        <p>Questions? Call (314) 555-0100</p>
      </div>
    `;
    
    PRINTER.openPrintWindow(html, `Receipt - ${ticket.id}`);
  },

  // ============================================
  // REPAIR LABEL (Small format)
  // ============================================
  printLabel: (ticket) => {
    const html = `
      <style>
        body { 
          width: 4in; 
          padding: 10px;
          font-family: Arial, sans-serif;
        }
        .label-header {
          text-align: center;
          border-bottom: 2px solid #5D3FD3;
          padding-bottom: 5px;
          margin-bottom: 10px;
        }
        .label-header h2 {
          color: #5D3FD3;
          font-size: 18px;
          margin: 0;
        }
        .ticket-id {
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          margin: 10px 0;
          font-family: monospace;
        }
        .info {
          font-size: 12px;
          margin: 5px 0;
        }
        .info strong {
          display: inline-block;
          width: 60px;
        }
      </style>
      
      <div class="label-header">
        <h2>FIXOLOGY</h2>
      </div>
      
      <div class="ticket-id">${ticket.id}</div>
      
      <div class="info"><strong>Device:</strong> ${ticket.device?.brand || ''} ${ticket.device?.model || 'Unknown'}</div>
      <div class="info"><strong>Customer:</strong> ${ticket.customer?.name || 'N/A'}</div>
      <div class="info"><strong>Repair:</strong> ${(ticket.repair?.type || 'repair').replace(/_/g, ' ')}</div>
      <div class="info"><strong>Date:</strong> ${PRINTER.formatDate(ticket.createdAt)}</div>
      
      <div style="text-align: center; margin-top: 15px; font-family: 'Libre Barcode 39', monospace; font-size: 36px;">
        *${ticket.id}*
      </div>
    `;
    
    PRINTER.openPrintWindow(html, `Label - ${ticket.id}`);
  },

  // ============================================
  // CLAIM TICKET (Customer copy)
  // ============================================
  printClaimTicket: (ticket) => {
    const html = `
      <style>
        body { 
          width: 3in; 
          padding: 15px;
          font-family: Arial, sans-serif;
          text-align: center;
        }
        .header h2 {
          color: #5D3FD3;
          font-size: 20px;
          margin: 0 0 5px 0;
        }
        .ticket-id {
          font-size: 28px;
          font-weight: bold;
          margin: 15px 0;
          font-family: monospace;
          background: #f5f5f5;
          padding: 10px;
          border-radius: 8px;
        }
        .details {
          text-align: left;
          font-size: 12px;
          margin: 15px 0;
        }
        .details p {
          margin: 5px 0;
        }
        .barcode {
          font-family: 'Libre Barcode 39', monospace;
          font-size: 40px;
          margin: 15px 0;
        }
        .footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px dashed #ccc;
          font-size: 11px;
          color: #666;
        }
      </style>
      
      <div class="header">
        <h2>FIXOLOGY</h2>
        <p style="font-size: 11px; color: #666;">CLAIM TICKET</p>
      </div>
      
      <div class="ticket-id">${ticket.id}</div>
      
      <div class="details">
        <p><strong>Device:</strong> ${ticket.device?.brand || ''} ${ticket.device?.model || 'Unknown'}</p>
        <p><strong>Repair:</strong> ${(ticket.repair?.type || 'repair').replace(/_/g, ' ')}</p>
        <p><strong>Est. Total:</strong> ${PRINTER.formatCurrency(ticket.pricing?.total)}</p>
        <p><strong>Date:</strong> ${PRINTER.formatDate(ticket.createdAt)}</p>
      </div>
      
      <div class="barcode">*${ticket.id}*</div>
      
      <div class="footer">
        <p><strong>Keep this ticket!</strong></p>
        <p>Present when picking up your device.</p>
        <p style="margin-top: 10px;">Questions? (314) 555-0100</p>
      </div>
    `;
    
    PRINTER.openPrintWindow(html, `Claim Ticket - ${ticket.id}`);
  }
};

