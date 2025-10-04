// Constantes de tradução comuns
export const COMMON = {
  // Ações gerais
  ACTIONS: {
    SUBMIT: 'common.actions.submit',
    CANCEL: 'common.actions.cancel',
    SAVE: 'common.actions.save',
    DELETE: 'common.actions.delete',
    EDIT: 'common.actions.edit',
    VIEW: 'common.actions.view',
    BACK: 'common.actions.back',
    NEXT: 'common.actions.next',
    CLOSE: 'common.actions.close',
    CONFIRM: 'common.actions.confirm',
    LOADING: 'common.actions.loading',
  },
  
  // Status
  STATUS: {
    ACTIVE: 'common.status.active',
    INACTIVE: 'common.status.inactive',
    PENDING: 'common.status.pending',
    APPROVED: 'common.status.approved',
    REJECTED: 'common.status.rejected',
    SUSPENDED: 'common.status.suspended',
  },
  
  // Mensagens
  MESSAGES: {
    SUCCESS: 'common.messages.success',
    ERROR: 'common.messages.error',
    WARNING: 'common.messages.warning',
    INFO: 'common.messages.info',
    LOADING: 'common.messages.loading',
    NO_DATA: 'common.messages.noData',
    CONFIRM_DELETE: 'common.messages.confirmDelete',
  },
  
  // Validações
  VALIDATION: {
    REQUIRED: 'common.validation.required',
    INVALID_EMAIL: 'common.validation.invalidEmail',
    INVALID_PHONE: 'common.validation.invalidPhone',
    MIN_LENGTH: 'common.validation.minLength',
    MAX_LENGTH: 'common.validation.maxLength',
    PASSWORDS_DONT_MATCH: 'common.validation.passwordsDontMatch',
  },
  
  // Empresa
  COMPANY: {
    NAME: 'common.company.name',
    DESCRIPTION: 'common.company.description',
    EMAIL: 'common.company.email',
    PHONE: 'common.company.phone',
    ADDRESS: 'common.company.address',
    WHATSAPP: 'common.company.whatsapp',
  },
  
  // Footer
  FOOTER: {
    RIGHTS: 'common.footer.rights',
    PRIVACY: 'common.footer.privacy',
    TERMS: 'common.footer.terms',
    ABOUT: 'common.footer.about',
    CONTACT: 'common.footer.contact',
  },
  
  // FAQ
  FAQ: {
    TITLE: 'common.faq.title',
    SUBTITLE: 'common.faq.subtitle',
    FEATURE: 'common.faq.feature',
  },
  
  // Depoimentos
  TESTIMONIALS: {
    TITLE: 'common.testimonials.title',
    SUBTITLE: 'common.testimonials.subtitle',
    FEATURE: 'common.testimonials.feature',
  },
} as const;
