// Country-specific payment data for African and international markets

export interface CountryPaymentConfig {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  methods: string[]; // Available payment method types
  banks: string[];
  mobileProviders: string[];
  popularMethods: string[]; // Most common for that country
}

export const COUNTRY_PAYMENT_DATA: Record<string, CountryPaymentConfig> = {
  NG: {
    code: "NG", name: "Nigeria", currency: "NGN", currencySymbol: "₦",
    methods: ["BANK_TRANSFER", "MOBILE_MONEY", "CRYPTO"],
    banks: [
      "Access Bank", "Zenith Bank", "GTBank (Guaranty Trust)", "First Bank of Nigeria",
      "United Bank for Africa (UBA)", "Fidelity Bank", "Union Bank", "Stanbic IBTC",
      "Sterling Bank", "Wema Bank (ALAT)", "Polaris Bank", "Ecobank Nigeria",
      "Keystone Bank", "FCMB", "Heritage Bank", "Jaiz Bank", "Providus Bank",
      "Globus Bank", "Titan Trust Bank", "Parallex Bank", "Optimus Bank"
    ],
    mobileProviders: [
      "OPay", "PalmPay", "Kuda Bank", "Moniepoint", "Carbon (Paylater)",
      "FairMoney", "Piggyvest", "Chipper Cash", "Barter by Flutterwave"
    ],
    popularMethods: ["BANK_TRANSFER", "MOBILE_MONEY"],
  },
  KE: {
    code: "KE", name: "Kenya", currency: "KES", currencySymbol: "KSh",
    methods: ["BANK_TRANSFER", "MOBILE_MONEY", "PAYPAL"],
    banks: [
      "Kenya Commercial Bank (KCB)", "Equity Bank", "Co-operative Bank",
      "ABSA Bank Kenya", "Standard Chartered Kenya", "NCBA Bank",
      "I&M Bank", "Diamond Trust Bank (DTB)", "Stanbic Bank Kenya",
      "Family Bank", "Bank of Africa Kenya", "Sidian Bank",
      "HF Group", "Prime Bank", "Victoria Commercial Bank"
    ],
    mobileProviders: [
      "M-Pesa (Safaricom)", "Airtel Money", "T-Kash (Telkom)"
    ],
    popularMethods: ["MOBILE_MONEY", "BANK_TRANSFER"],
  },
  GH: {
    code: "GH", name: "Ghana", currency: "GHS", currencySymbol: "GH₵",
    methods: ["BANK_TRANSFER", "MOBILE_MONEY"],
    banks: [
      "GCB Bank", "Ecobank Ghana", "Fidelity Bank Ghana", "Stanbic Bank Ghana",
      "Standard Chartered Ghana", "ABSA Bank Ghana", "CalBank",
      "Zenith Bank Ghana", "Access Bank Ghana", "Republic Bank Ghana",
      "Societe Generale Ghana", "First National Bank Ghana", "Bank of Africa Ghana",
      "Prudential Bank", "ADB (Agricultural Development Bank)"
    ],
    mobileProviders: [
      "MTN Mobile Money (MoMo)", "Vodafone Cash", "AirtelTigo Money"
    ],
    popularMethods: ["MOBILE_MONEY", "BANK_TRANSFER"],
  },
  ZA: {
    code: "ZA", name: "South Africa", currency: "ZAR", currencySymbol: "R",
    methods: ["BANK_TRANSFER", "MOBILE_MONEY", "PAYPAL"],
    banks: [
      "Standard Bank", "First National Bank (FNB)", "ABSA Bank",
      "Nedbank", "Capitec Bank", "Investec", "African Bank",
      "Discovery Bank", "TymeBank", "Bank Zero",
      "Bidvest Bank", "Sasfin Bank", "Grindrod Bank"
    ],
    mobileProviders: [
      "FNB eWallet", "Capitec Pay", "Nedbank MobiMoney",
      "Standard Bank Instant Money", "M-Pesa South Africa"
    ],
    popularMethods: ["BANK_TRANSFER"],
  },
  TZ: {
    code: "TZ", name: "Tanzania", currency: "TZS", currencySymbol: "TSh",
    methods: ["BANK_TRANSFER", "MOBILE_MONEY"],
    banks: [
      "CRDB Bank", "NMB Bank", "NBC Bank", "Stanbic Bank Tanzania",
      "Standard Chartered Tanzania", "Exim Bank Tanzania",
      "DTB Tanzania", "I&M Bank Tanzania", "Equity Bank Tanzania",
      "KCB Bank Tanzania", "Azania Bank", "Access Bank Tanzania"
    ],
    mobileProviders: [
      "M-Pesa (Vodacom)", "Tigo Pesa", "Airtel Money", "Halotel Halopesa"
    ],
    popularMethods: ["MOBILE_MONEY", "BANK_TRANSFER"],
  },
  UG: {
    code: "UG", name: "Uganda", currency: "UGX", currencySymbol: "USh",
    methods: ["BANK_TRANSFER", "MOBILE_MONEY"],
    banks: [
      "Stanbic Bank Uganda", "Standard Chartered Uganda", "ABSA Bank Uganda",
      "Centenary Bank", "DFCU Bank", "Equity Bank Uganda",
      "Bank of Africa Uganda", "Housing Finance Bank", "Post Bank Uganda",
      "Finance Trust Bank", "Opportunity Bank Uganda"
    ],
    mobileProviders: [
      "MTN Mobile Money", "Airtel Money"
    ],
    popularMethods: ["MOBILE_MONEY", "BANK_TRANSFER"],
  },
  RW: {
    code: "RW", name: "Rwanda", currency: "RWF", currencySymbol: "FRw",
    methods: ["BANK_TRANSFER", "MOBILE_MONEY"],
    banks: [
      "Bank of Kigali", "I&M Bank Rwanda", "Equity Bank Rwanda",
      "Access Bank Rwanda", "KCB Bank Rwanda", "Ecobank Rwanda",
      "Cogebanque", "BPR (Banque Populaire du Rwanda)", "GT Bank Rwanda"
    ],
    mobileProviders: [
      "MTN Mobile Money", "Airtel Money"
    ],
    popularMethods: ["MOBILE_MONEY", "BANK_TRANSFER"],
  },
  CM: {
    code: "CM", name: "Cameroon", currency: "XAF", currencySymbol: "FCFA",
    methods: ["BANK_TRANSFER", "MOBILE_MONEY"],
    banks: [
      "Afriland First Bank", "Ecobank Cameroon", "Societe Generale Cameroon",
      "BICEC", "UBA Cameroon", "Standard Chartered Cameroon",
      "CCA Bank", "NFC Bank", "BGFI Bank Cameroon"
    ],
    mobileProviders: [
      "MTN Mobile Money", "Orange Money"
    ],
    popularMethods: ["MOBILE_MONEY"],
  },
  SN: {
    code: "SN", name: "Senegal", currency: "XOF", currencySymbol: "CFA",
    methods: ["BANK_TRANSFER", "MOBILE_MONEY"],
    banks: [
      "Banque de l'Habitat du Sénégal", "CBAO Groupe Attijariwafa",
      "Ecobank Senegal", "Societe Generale Senegal", "BICIS",
      "UBA Senegal", "Bank of Africa Senegal", "BHS"
    ],
    mobileProviders: [
      "Orange Money", "Wave", "Free Money"
    ],
    popularMethods: ["MOBILE_MONEY"],
  },
  ET: {
    code: "ET", name: "Ethiopia", currency: "ETB", currencySymbol: "Br",
    methods: ["BANK_TRANSFER", "MOBILE_MONEY"],
    banks: [
      "Commercial Bank of Ethiopia (CBE)", "Awash Bank", "Dashen Bank",
      "Bank of Abyssinia", "Nib International Bank", "United Bank",
      "Wegagen Bank", "Cooperative Bank of Oromia", "Lion International Bank",
      "Zemen Bank", "Berhan Bank", "Bunna Bank"
    ],
    mobileProviders: [
      "Telebirr", "CBE Birr", "M-Birr"
    ],
    popularMethods: ["BANK_TRANSFER", "MOBILE_MONEY"],
  },
  EG: {
    code: "EG", name: "Egypt", currency: "EGP", currencySymbol: "E£",
    methods: ["BANK_TRANSFER", "MOBILE_MONEY", "PAYPAL"],
    banks: [
      "National Bank of Egypt", "Banque Misr", "CIB (Commercial International Bank)",
      "QNB Al Ahli", "Faisal Islamic Bank", "HSBC Egypt",
      "Arab African International Bank", "Alex Bank", "Banque du Caire"
    ],
    mobileProviders: [
      "Vodafone Cash", "Orange Cash", "Etisalat Cash", "WE Pay", "InstaPay"
    ],
    popularMethods: ["BANK_TRANSFER", "MOBILE_MONEY"],
  },
  // International
  US: {
    code: "US", name: "United States", currency: "USD", currencySymbol: "$",
    methods: ["BANK_TRANSFER", "PAYPAL", "CRYPTO"],
    banks: ["Chase", "Bank of America", "Wells Fargo", "Citibank", "Capital One", "PNC Bank", "US Bank", "TD Bank"],
    mobileProviders: ["Zelle", "Venmo", "Cash App"],
    popularMethods: ["BANK_TRANSFER", "PAYPAL"],
  },
  GB: {
    code: "GB", name: "United Kingdom", currency: "GBP", currencySymbol: "£",
    methods: ["BANK_TRANSFER", "PAYPAL"],
    banks: ["Barclays", "HSBC UK", "Lloyds", "NatWest", "Santander UK", "Monzo", "Revolut", "Starling Bank"],
    mobileProviders: [],
    popularMethods: ["BANK_TRANSFER"],
  },
  IN: {
    code: "IN", name: "India", currency: "INR", currencySymbol: "₹",
    methods: ["BANK_TRANSFER", "MOBILE_MONEY"],
    banks: ["SBI", "HDFC Bank", "ICICI Bank", "Axis Bank", "Punjab National Bank", "Bank of Baroda", "Kotak Mahindra"],
    mobileProviders: ["UPI (PhonePe)", "UPI (Google Pay)", "Paytm"],
    popularMethods: ["BANK_TRANSFER", "MOBILE_MONEY"],
  },
};

export const ALL_COUNTRIES = Object.values(COUNTRY_PAYMENT_DATA);

export function getCountryConfig(code: string): CountryPaymentConfig {
  return COUNTRY_PAYMENT_DATA[code] || COUNTRY_PAYMENT_DATA["NG"];
}
