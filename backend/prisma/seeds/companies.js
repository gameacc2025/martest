const DEFAULT_MAIN_COMPANY = {
  name: 'Main',
  type: 'TELECOM_OPERATOR',
  status: 'ACTIVE',
  isVerified: true,
};

const DEFAULT_COMPANIES = [
  { name: 'شرکت مخابرات استان تهران' },
  { name: 'شرکت مخابرات استان خراسان شمالی' },
  { name: 'شرکت مخابرات استان خراسان جنوبی' },
  { name: 'شرکت مخابرات استان یزد' },
  { name: 'شرکت مخابرات استان همدان' },
  { name: 'شرکت مخابرات استان هرمزگان' },
  { name: 'شرکت مخابرات استان مرکزی' },
  { name: 'شرکت مخابرات استان مازندران' },
  { name: 'شرکت مخابرات استان لرستان' },
  { name: 'شرکت مخابرات استان گیلان' },
  { name: 'شرکت مخابرات استان گلستان' },
  { name: 'شرکت مخابرات استان کهگیلویه و بویراحمد' },
  { name: 'شرکت مخابرات استان کرمانشاه' },
  { name: 'شرکت مخابرات استان کرمان' },
  { name: 'شرکت مخابرات استان کردستان' },
  { name: 'شرکت مخابرات استان قم' },
  { name: 'شرکت مخابرات استان قزوین' },
  { name: 'شرکت مخابرات استان فارس' },
  { name: 'شرکت مخابرات استان سیستان و بلوچستان' },
  { name: 'شرکت مخابرات استان سمنان' },
  { name: 'شرکت مخابرات استان زنجان' },
  { name: 'شرکت مخابرات استان خوزستان' },
  { name: 'شرکت مخابرات استان خراسان رضوی' },
  { name: 'شرکت مخابرات استان چهارمحال و بختیاری' },
  { name: 'شرکت مخابرات استان بوشهر' },
  { name: 'شرکت مخابرات استان ایلام' },
  { name: 'شرکت مخابرات استان اصفهان' },
  { name: 'شرکت مخابرات استان اردبیل' },
  { name: 'شرکت مخابرات استان آذربایجان غربی' },
  { name: 'شرکت مخابرات استان آذربایجان شرقی' },
];

async function seedCompanies(prisma) {
  const companiesByName = new Map();

  for (const company of DEFAULT_COMPANIES) {
    const saved = await prisma.company.upsert({
      where: { name: company.name },
      update: {
        type: company.type || 'TELECOM_OPERATOR',
        status: company.status || 'ACTIVE',
      },
      create: {
        name: company.name,
        type: company.type || 'TELECOM_OPERATOR',
        status: company.status || 'ACTIVE',
        isVerified: company.isVerified || false,
      },
    });

    companiesByName.set(company.name, saved);
  }

  return companiesByName;
}

async function seedMainCompany(prisma) {
  return prisma.company.upsert({
    where: { name: DEFAULT_MAIN_COMPANY.name },
    update: {
      type: DEFAULT_MAIN_COMPANY.type,
      status: DEFAULT_MAIN_COMPANY.status,
      isVerified: DEFAULT_MAIN_COMPANY.isVerified,
    },
    create: DEFAULT_MAIN_COMPANY,
  });
}

module.exports = {
  DEFAULT_MAIN_COMPANY,
  DEFAULT_COMPANIES,
  seedMainCompany,
  seedCompanies,
};