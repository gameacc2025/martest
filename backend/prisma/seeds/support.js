const CATEGORIES = [
  { key: 'GENERAL', name: 'عمومی', description: 'سؤالات و درخواست‌های عمومی پشتیبانی', sortOrder: 10 },
  { key: 'TECHNICAL', name: 'فنی', description: 'مشکلات فنی وب‌سایت و پنل‌ها', sortOrder: 20 },
  { key: 'ACCOUNT', name: 'حساب کاربری', description: 'ورود، ثبت‌نام و دسترسی حساب', sortOrder: 30 },
  { key: 'PRODUCT', name: 'محصولات و کاتالوگ', description: 'اطلاعات و مدیریت محصولات', sortOrder: 40 },
  { key: 'INQUIRY', name: 'استعلام و سفارش', description: 'پیگیری استعلام‌ها و درخواست‌های خرید', sortOrder: 50 },
];
const QUEUES = [
  { key: 'GENERAL', name: 'پشتیبانی عمومی', description: 'صف عمومی درخواست‌های پشتیبانی', sortOrder: 10 },
  { key: 'TECHNICAL', name: 'پشتیبانی فنی', description: 'صف رسیدگی به مسائل فنی', sortOrder: 20 },
  { key: 'ACCOUNT', name: 'حساب و دسترسی', description: 'صف مسائل حساب کاربری', sortOrder: 30 },
];
const SLA = {
  LOW: { firstResponseMinutes: 480, resolutionMinutes: 4320 },
  NORMAL: { firstResponseMinutes: 120, resolutionMinutes: 1440 },
  HIGH: { firstResponseMinutes: 60, resolutionMinutes: 480 },
  URGENT: { firstResponseMinutes: 15, resolutionMinutes: 120 },
};

async function seedSupport(prisma) {
  const categories = [];
  for (const item of CATEGORIES) {
    categories.push(await prisma.supportCategory.upsert({
      where: { key: item.key },
      create: item,
      update: { name: item.name, description: item.description, sortOrder: item.sortOrder, isActive: true },
    }));
  }
  const queues = [];
  for (const item of QUEUES) {
    queues.push(await prisma.supportQueue.upsert({
      where: { key: item.key },
      create: item,
      update: { name: item.name, description: item.description, sortOrder: item.sortOrder, isActive: true },
    }));
  }
  let policies = 0;
  for (const category of categories) {
    for (const [priority, values] of Object.entries(SLA)) {
      await prisma.supportSlaPolicy.upsert({
        where: { categoryId_priority: { categoryId: category.id, priority } },
        create: { categoryId: category.id, priority, ...values, isActive: true },
        update: { ...values, isActive: true },
      });
      policies += 1;
    }
  }
  return { categories: categories.length, queues: queues.length, policies };
}

module.exports = { seedSupport, CATEGORIES, QUEUES, SLA };
