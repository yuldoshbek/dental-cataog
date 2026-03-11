import db from '../db.js';
import { createBitrixCatalogRepository } from '../../catalog/bitrixCatalogRepository.js';
import { getCatalogProviderFromEnv } from '../../catalog/bitrixConfig.js';
import { createServerInquiryStore } from './inquiryStore.js';
import { createLocalCatalogRepository } from './localCatalogRepository.js';

const inquiryStore = createServerInquiryStore(db);
const provider = getCatalogProviderFromEnv();

const catalogRepository = provider === 'bitrix'
  ? createBitrixCatalogRepository({ inquiryStore })
  : createLocalCatalogRepository({ db, inquiryStore });

export function getCatalogRepository() {
  return catalogRepository;
}

export function getCatalogProviderInfo() {
  return catalogRepository.getProviderInfo();
}
