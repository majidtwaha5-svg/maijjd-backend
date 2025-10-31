const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  return pool;
}

async function query(text, params) {
  const p = getPool();
  if (!p) throw new Error('No DATABASE_URL configured');
  const res = await p.query(text, params);
  return res;
}

async function init() {
  const p = getPool();
  if (!p) return false;
  await p.query(`create table if not exists users(
    id uuid primary key,
    name text,
    email text unique,
    phone text unique,
    role text,
    password_hash text,
    created_at timestamptz default now()
  )`);
  await p.query(`create table if not exists sessions(
    id uuid primary key,
    user_email text,
    ip text,
    created_at timestamptz default now()
  )`);
  await p.query(`create table if not exists feedback(
    id uuid primary key,
    email text,
    category text,
    message text,
    status text,
    created_at timestamptz default now()
  )`);
  await p.query(`create table if not exists events(
    id uuid primary key,
    event text,
    meta jsonb,
    t bigint
  )`);
  await p.query(`create table if not exists invoices(
    id uuid primary key,
    amount numeric,
    status text,
    created_at timestamptz default now()
  )`);
  await p.query(`create table if not exists software(
    id text primary key,
    name text,
    category text,
    description text,
    standard_price numeric,
    premium_price numeric
  )`);
  // seed software if empty
  const count = Number((await p.query('select count(*) from software')).rows[0].count);
  if (count === 0) {
    const rows = [
      ['crm-pro','Maijjd CRM Pro','Business','Customer relationship management.',59,199],
      ['analytics-suite','Maijjd Analytics Suite','Analytics','Analytics & dashboards.',79,399],
      ['security-shield','Maijjd Security Shield','Security','Security & compliance.',299,599],
      ['cloud-manager','Maijjd Cloud Manager','Cloud','Cloud resources manager.',119,349],
      ['dev-studio','Maijjd Development Studio','Development','Dev tools & pipelines.',59,249],
      ['web-builder','Maijjd Web Builder Pro','Web','Web site builder.',49,179],
      ['infra-manager','Maijjd Infrastructure Manager','Infrastructure','Infra orchestration.',199,429],
      ['marketing-auto','Maijjd Marketing Automation','Marketing & Automation','Automation campaigns.',49,159],
      ['pm-pro','Maijjd Project Management Pro','Project Management','Project planning.',25,89],
      ['ds-studio','Maijjd Data Science Studio','Data Science & ML','ML & data platform.',199,599],
      ['cs-mjnd','Maijjd Customer Support MNJD, MJ, and Team','Customer Support','MNJD, MJ, and Team helpdesk.',35,129],
      ['fin-analytics','Maijjd Financial Analytics','Financial Technology','FinAnalytics.',119,349],
      ['health-analytics','Maijjd Healthcare Analytics','Healthcare Technology','Health analytics.',199,499],
      ['edu-platform','Maijjd Education Platform','Education Technology','Education platform.',25,79],
      ['mjnd-coding','Maijjd MJND Coding Assistant','MJND Development','Intelligent coding assistant.',199,399],
      ['mjnd-editing','Maijjd MJND Editing Suite','MJND Content','Editing and content tools.',149,299],
      ['mjnd-devtools','Maijjd MJND Development Tools','MJND Development','End-to-end MJND dev tools.',299,499],
      // New categories
      ['erp-suite','Maijjd ERP Suite','Enterprise','Enterprise resource planning suite.',299,699],
      ['hrms','Maijjd HRMS','Human Resources','Human resources and payroll management.',49,149],
      ['inventory-pro','Maijjd Inventory Pro','Inventory','Inventory and warehouse management.',39,129],
      ['retail-pos','Maijjd Retail POS','Retail','Point of sale for retail stores.',29,99],
      ['ecommerce-hub','Maijjd eCommerce Hub','E-commerce','Headless commerce and storefront.',59,199],
      ['support-desk','Maijjd Support Desk','IT Service','Ticketing and ITSM platform.',25,89],
      ['legal-docs','Maijjd Legal Docs','Legal','Contract and document automation.',79,249],
      ['gov-compliance','Maijjd Gov Compliance','Public Sector','Regulatory and compliance automation.',149,399],
      ['energy-ops','Maijjd Energy Ops','Energy','Energy operations & analytics.',199,499],
      ['agri-insights','Maijjd Agri Insights','Agriculture','Farm analytics & IoT dashboards.',59,179],
      ['media-studio','Maijjd Media Studio','Media','Digital asset & media workflows.',69,199],
      ['travel-booking','Maijjd Travel Booking','Travel','Booking engine & analytics.',49,149],
      ['education-lms','Maijjd LMS','Education','Learning management system.',29,99],
      ['health-emr','Maijjd Health EMR','Healthcare','Electronic medical records.',199,599],
      ['fin-ledger','Maijjd Financial Ledger','Finance','General ledger & accounting.',79,249],
      ['iot-platform','Maijjd IoT Platform','IoT','Device management & telemetry.',99,299],
      ['ai-vision','Maijjd Vision Suite','Computer Vision','Vision models & labeling.',149,399]
    ];
    for (const r of rows) {
      await p.query(
        'insert into software(id,name,category,description,standard_price,premium_price) values($1,$2,$3,$4,$5,$6) on conflict (id) do update set name=excluded.name, category=excluded.category, description=excluded.description, standard_price=excluded.standard_price, premium_price=excluded.premium_price',
        r
      );
    }
  } else {
    // Ensure any newly added seeds are upserted on deploys
    const rows = [
      ['erp-suite','Maijjd ERP Suite','Enterprise','Enterprise resource planning suite.',299,699],
      ['hrms','Maijjd HRMS','Human Resources','Human resources and payroll management.',49,149],
      ['inventory-pro','Maijjd Inventory Pro','Inventory','Inventory and warehouse management.',39,129],
      ['retail-pos','Maijjd Retail POS','Retail','Point of sale for retail stores.',29,99],
      ['ecommerce-hub','Maijjd eCommerce Hub','E-commerce','Headless commerce and storefront.',59,199],
      ['support-desk','Maijjd Support Desk','IT Service','Ticketing and ITSM platform.',25,89],
      ['legal-docs','Maijjd Legal Docs','Legal','Contract and document automation.',79,249],
      ['gov-compliance','Maijjd Gov Compliance','Public Sector','Regulatory and compliance automation.',149,399],
      ['energy-ops','Maijjd Energy Ops','Energy','Energy operations & analytics.',199,499],
      ['agri-insights','Maijjd Agri Insights','Agriculture','Farm analytics & IoT dashboards.',59,179],
      ['media-studio','Maijjd Media Studio','Media','Digital asset & media workflows.',69,199],
      ['travel-booking','Maijjd Travel Booking','Travel','Booking engine & analytics.',49,149],
      ['education-lms','Maijjd LMS','Education','Learning management system.',29,99],
      ['health-emr','Maijjd Health EMR','Healthcare','Electronic medical records.',199,599],
      ['fin-ledger','Maijjd Financial Ledger','Finance','General ledger & accounting.',79,249],
      ['iot-platform','Maijjd IoT Platform','IoT','Device management & telemetry.',99,299],
      ['ai-vision','Maijjd Vision Suite','Computer Vision','Vision models & labeling.',149,399]
    ];
    for (const r of rows) {
      await p.query(
        'insert into software(id,name,category,description,standard_price,premium_price) values($1,$2,$3,$4,$5,$6) on conflict (id) do update set name=excluded.name, category=excluded.category, description=excluded.description, standard_price=excluded.standard_price, premium_price=excluded.premium_price',
        r
      );
    }
  }
  return true;
}

module.exports = { getPool, query, init };


