// Constantes de tradução de formulários
export const FORMS = {
  // Campos comuns
  FIELDS: {
    FIRST_NAME: 'forms.fields.firstName',
    LAST_NAME: 'forms.fields.lastName',
    EMAIL: 'forms.fields.email',
    PHONE: 'forms.fields.phone',
    PASSWORD: 'forms.fields.password',
    CONFIRM_PASSWORD: 'forms.fields.confirmPassword',
    MESSAGE: 'forms.fields.message',
    SUBJECT: 'forms.fields.subject',
    CITY: 'forms.fields.city',
    BIRTH_DATE: 'forms.fields.birthDate',
  },
  
  // Formulário de solicitação
  REQUEST: {
    TITLE: 'forms.request.title',
    SUBTITLE: 'forms.request.subtitle',
    TYPE_LABEL: 'forms.request.typeLabel',
    TYPE_AFFILIATE: 'forms.request.typeAffiliate',
    TYPE_RENTER: 'forms.request.typeRenter',
    TYPE_AFFILIATE_DESC: 'forms.request.typeAffiliateDesc',
    TYPE_RENTER_DESC: 'forms.request.typeRenterDesc',
    LICENSE_NUMBER: 'forms.request.licenseNumber',
    LICENSE_EXPIRY: 'forms.request.licenseExpiry',
    VEHICLE_INFO: 'forms.request.vehicleInfo',
    VEHICLE_MAKE: 'forms.request.vehicleMake',
    VEHICLE_MODEL: 'forms.request.vehicleModel',
    VEHICLE_YEAR: 'forms.request.vehicleYear',
    VEHICLE_PLATE: 'forms.request.vehiclePlate',
    ADDITIONAL_INFO: 'forms.request.additionalInfo',
    SUBMIT_BUTTON: 'forms.request.submitButton',
    SUCCESS_MESSAGE: 'forms.request.successMessage',
    ERROR_MESSAGE: 'forms.request.errorMessage',
  },
  
  // Formulário de contato
  CONTACT: {
    TITLE: 'forms.contact.title',
    SUBTITLE: 'forms.contact.subtitle',
    SUBMIT_BUTTON: 'forms.contact.submitButton',
    SUCCESS_MESSAGE: 'forms.contact.successMessage',
    ERROR_MESSAGE: 'forms.contact.errorMessage',
  },
  
  // Login
  LOGIN: {
    TITLE: 'forms.login.title',
    SUBTITLE: 'forms.login.subtitle',
    SUBMIT_BUTTON: 'forms.login.submitButton',
    FORGOT_PASSWORD: 'forms.login.forgotPassword',
    NO_ACCOUNT: 'forms.login.noAccount',
    SIGNUP_LINK: 'forms.login.signupLink',
  },
} as const;
