export interface CountryConfig {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  methods: string[];
  popularMethods: string[];
  banks: string[];
  mobileProviders: string[];
}

const COUNTRIES: CountryConfig[] = [
  {
    code: "NG", name: "Nigeria", currency: "NGN", currencySymbol: "₦",
    methods: ["BANK_TRANSFER", "MOBILE_MONEY"],
    popularMethods: ["BANK_TRANSFER"],
    banks: ["Access Bank", "GT Bank", "First Bank", "UBA", "Zenith Bank", "Kuda", "Opay", "Sterling Bank", "Wema Bank", "Fidelity Bank", "Union Bank", "Stanbic IBTC", "FCMB", "Polaris Bank", "Ecobank"],
    mobileProviders: ["OPay", "PalmPay", "Kuda", "MTN MoMo"],
  },
  {
    code: "KE", name: "Kenya", currency: "KES", currencySymbol: "KSh",
    methods: ["MOBILE_MONEY", "BANK_TRANSFER"],
    popularMethods: ["MOBILE_MONEY"],
    banks: ["Equity Bank", "KCB Bank", "Co-operative Bank", "ABSA Kenya", "Standard Chartered", "NCBA", "Stanbic Bank", "I&M Bank"],
    mobileProviders: ["M-Pesa", "Airtel Money"],
  },
  {
    code: "GH", name: "Ghana", currency: "GHS", currencySymbol: "GH₵",
    methods: ["MOBILE_MONEY", "BANK_TRANSFER"],
    popularMethods: ["MOBILE_MONEY"],
    banks: ["GCB Bank", "Ecobank Ghana", "Stanbic Bank", "Absa Ghana", "Fidelity Bank", "CalBank", "Standard Chartered"],
    mobileProviders: ["MTN MoMo", "AirtelTigo Money", "Vodafone Cash"],
  },
  {
    code: "ZA", name: "South Africa", currency: "ZAR", currencySymbol: "R",
    methods: ["BANK_TRANSFER"],
    popularMethods: ["BANK_TRANSFER"],
    banks: ["Standard Bank", "ABSA", "FNB", "Nedbank", "Capitec", "TymeBank", "Discovery Bank", "African Bank"],
    mobileProviders: [],
  },
  {
    code: "TZ", name: "Tanzania", currency: "TZS", currencySymbol: "TSh",
    methods: ["MOBILE_MONEY", "BANK_TRANSFER"],
    popularMethods: ["MOBILE_MONEY"],
    banks: ["CRDB Bank", "NMB Bank", "NBC", "Stanbic Bank", "Exim Bank"],
    mobileProviders: ["M-Pesa", "Tigo Pesa", "Airtel Money", "Halopesa"],
  },
  {
    code: "UG", name: "Uganda", currency: "UGX", currencySymbol: "USh",
    methods: ["MOBILE_MONEY", "BANK_TRANSFER"],
    popularMethods: ["MOBILE_MONEY"],
    banks: ["Stanbic Uganda", "Standard Chartered", "ABSA Uganda", "Centenary Bank", "DFCU Bank"],
    mobileProviders: ["MTN MoMo", "Airtel Money"],
  },
  {
    code: "CM", name: "Cameroon", currency: "XAF", currencySymbol: "FCFA",
    methods: ["MOBILE_MONEY", "BANK_TRANSFER"],
    popularMethods: ["MOBILE_MONEY"],
    banks: ["Afriland First Bank", "BICEC", "Ecobank Cameroon", "Societe Generale"],
    mobileProviders: ["MTN MoMo", "Orange Money"],
  },
  {
    code: "EG", name: "Egypt", currency: "EGP", currencySymbol: "E£",
    methods: ["BANK_TRANSFER"],
    popularMethods: ["BANK_TRANSFER"],
    banks: ["National Bank of Egypt", "Banque Misr", "CIB", "QNB Alahli", "HSBC Egypt"],
    mobileProviders: ["Vodafone Cash", "Orange Cash"],
  },
  {
    code: "GB", name: "United Kingdom", currency: "GBP", currencySymbol: "£",
    methods: ["BANK_TRANSFER", "PAYPAL"],
    popularMethods: ["BANK_TRANSFER"],
    banks: ["Barclays", "HSBC", "Lloyds", "NatWest", "Santander", "Monzo", "Starling", "Revolut", "Metro Bank"],
    mobileProviders: [],
  },
  {
    code: "US", name: "United States", currency: "USD", currencySymbol: "$",
    methods: ["BANK_TRANSFER", "PAYPAL", "CHECK"],
    popularMethods: ["BANK_TRANSFER"],
    banks: ["Chase", "Bank of America", "Wells Fargo", "Citibank", "Capital One", "US Bank", "PNC", "TD Bank"],
    mobileProviders: [],
  },
  {
    code: "CA", name: "Canada", currency: "CAD", currencySymbol: "C$",
    methods: ["BANK_TRANSFER", "PAYPAL"],
    popularMethods: ["BANK_TRANSFER"],
    banks: ["RBC", "TD Canada Trust", "Scotiabank", "BMO", "CIBC", "National Bank", "Desjardins"],
    mobileProviders: [],
  },
  {
    code: "IN", name: "India", currency: "INR", currencySymbol: "₹",
    methods: ["BANK_TRANSFER", "MOBILE_MONEY"],
    popularMethods: ["BANK_TRANSFER"],
    banks: ["SBI", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra", "Punjab National Bank", "Bank of Baroda", "Canara Bank"],
    mobileProviders: ["Google Pay", "PhonePe", "Paytm"],
  },
  {
    code: "AU", name: "Australia", currency: "AUD", currencySymbol: "A$",
    methods: ["BANK_TRANSFER", "PAYPAL"],
    popularMethods: ["BANK_TRANSFER"],
    banks: ["Commonwealth Bank", "ANZ", "Westpac", "NAB", "Macquarie Bank", "ING Australia", "Bendigo Bank"],
    mobileProviders: [],
  },
  {
    code: "PK", name: "Pakistan", currency: "PKR", currencySymbol: "₨",
    methods: ["BANK_TRANSFER", "MOBILE_MONEY"],
    popularMethods: ["BANK_TRANSFER"],
    banks: ["HBL", "UBL", "MCB Bank", "Allied Bank", "Bank Alfalah", "Meezan Bank", "Askari Bank"],
    mobileProviders: ["JazzCash", "Easypaisa"],
  },
];

export const ALL_COUNTRIES = COUNTRIES;

export function getCountryConfig(code: string): CountryConfig {
  return COUNTRIES.find((c) => c.code === code) || {
    code: code || "US",
    name: code || "Unknown",
    currency: "USD",
    currencySymbol: "$",
    methods: ["BANK_TRANSFER"],
    popularMethods: ["BANK_TRANSFER"],
    banks: [],
    mobileProviders: [],
  };
}
