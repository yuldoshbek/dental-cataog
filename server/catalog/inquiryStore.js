import { v4 as uuid } from 'uuid';

export function createServerInquiryStore(db) {
  return {
    createLocalProductInquiry({
      productId,
      type,
      clientName,
      clientPhone,
      message,
      ipAddress,
    }) {
      const id = uuid();
      db.prepare(`
        INSERT INTO client_inquiries (id, product_id, type, client_name, client_phone, message, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, productId, type, clientName, clientPhone, message, ipAddress);

      return { success: true, id };
    },

    createExternalInquiry({
      product,
      type,
      clientName,
      clientPhone,
      message,
      ipAddress,
      source,
    }) {
      const id = uuid();
      db.prepare(`
        INSERT INTO external_inquiries (
          id, source, product_id, share_slug, external_code, brand, model, type,
          client_name, client_phone, message, ip_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        source,
        product.id,
        product.shareSlug ?? null,
        product.externalCode ?? null,
        product.brand ?? null,
        product.model ?? null,
        type,
        clientName,
        clientPhone,
        message,
        ipAddress,
      );

      return { success: true, id };
    },

    listAll() {
      const localRows = db.prepare(`
        SELECT
          ci.id,
          ci.product_id,
          ci.type,
          ci.client_name,
          ci.client_phone,
          ci.message,
          ci.ip_address,
          ci.created_at,
          p.brand,
          p.model,
          'local' AS source
        FROM client_inquiries ci
        LEFT JOIN products p ON ci.product_id = p.id
      `).all();

      const externalRows = db.prepare(`
        SELECT
          id,
          product_id,
          type,
          client_name,
          client_phone,
          message,
          ip_address,
          created_at,
          brand,
          model,
          source
        FROM external_inquiries
      `).all();

      return [...externalRows, ...localRows]
        .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
        .slice(0, 200);
    },
  };
}
