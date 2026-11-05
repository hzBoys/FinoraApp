# Finora Financial Intelligence — Implementation Roadmap

## 1. Tujuan Dokumen

Dokumen ini menjadi acuan pengembangan lanjutan Finora menuju:

**Proactive Personal Financial Intelligence for Young Users**

Dokumen ini bukan perintah untuk mengimplementasikan seluruh fitur sekaligus.

Implementasi harus dilakukan **bertahap berdasarkan prioritas, dependency, dan kesiapan data**.

Untuk sprint saat ini (v1.1.0), fokus hanya pada:

- **P0 — Foundation**
- **P1 — Core User Value**

Prioritas P2 sampai P8 hanya menjadi roadmap agar arsitektur yang dibuat sekarang tidak menghambat pengembangan berikutnya.

---

# 2. Konteks Produk

Finora adalah aplikasi personal finance management berbasis:

- React Native
- Expo
- TypeScript
- Supabase
- Gemini untuk AI/Smart Advisor

Fitur yang saat ini sudah tersedia antara lain:

- Authentication:
  - Login
  - Register
  - Forgot Password
  - OTP Reset Password
- Dashboard / Beranda
- Transaction Management
- Budget Management
- Portfolio:
  - Bank
  - E-Wallet
  - Investasi
- Manual Transaction Input
- Magic Receipt OCR
- Auto-Portfolio / Scan Saldo
- Smart Advisor berbasis Gemini
- Profile Management
- Notification Preferences
- Persistence melalui Supabase
- Existing navigation
- Existing design system

Seluruh fitur yang sudah berjalan harus dipertahankan.

Jangan melakukan rebuild aplikasi dari awal.

---

# 3. Product Direction

Finora diarahkan menjadi aplikasi yang tidak hanya mencatat kondisi finansial pengguna, tetapi juga:

- memahami kondisi keuangan pengguna;
- menganalisis posisi finansial;
- mengetahui batas aman penggunaan uang;
- mendeteksi perubahan penting;
- menunjukkan trade-off keputusan;
- memberi insight finansial secara proaktif;
- membantu pengguna membangun aset dan meningkatkan kapasitas finansial.

Target utama:

- mahasiswa;
- mahasiswa tingkat akhir;
- young professionals;
- pengguna muda yang mulai mengelola keuangan sendiri;
- pengguna yang mulai membangun aset dan meningkatkan earning capacity.

Prinsip utama produk:

> Finora tidak menentukan bagaimana pengguna harus menggunakan uangnya. Finora membantu menentukan batas aman, menunjukkan konsekuensi dari keputusan finansial, dan membantu pengguna mengoptimalkan uang sesuai kondisi dan tujuan mereka.

---

# 4. Filosofi Financial Intelligence

Finora tidak menggunakan pendekatan budgeting yang terlalu kaku seperti satu persentase tetap yang berlaku untuk semua pengguna.

Contoh:

- bukan selalu 50% Needs;
- bukan selalu 30% Wants;
- bukan selalu 20% Savings.

Finora menggunakan pendekatan:

**Constraint-Based + Priority-Based + Adaptive Financial Planning**

Prinsipnya:

1. Lindungi kondisi finansial minimum terlebih dahulu.
2. Pastikan kewajiban finansial terpenuhi.
3. Pastikan terdapat safety buffer yang memadai.
4. Pengguna tetap bebas membelanjakan uang selama masih berada dalam batas aman.
5. Setelah kondisi dasar aman, fokus dapat bergeser ke wealth building.
6. Income growth sama pentingnya dengan expense control.
7. Ownership, productive assets, skill development, business capital, dan leverage dapat menjadi bagian dari wealth creation.
8. Finora harus menjelaskan trade-off, bukan hanya memberikan larangan.
9. Rekomendasi harus adaptive berdasarkan kondisi pengguna.
10. Tidak semua pengguna menerima rekomendasi yang sama.
11. Gemini tidak boleh menjadi sumber utama perhitungan finansial.

---

# 5. Empat Pertanyaan Utama Finora

Setiap fitur Financial Intelligence harus membantu menjawab minimal salah satu pertanyaan berikut:

## 5.1 Apakah kondisi finansial saya aman?

**Am I financially safe?**

Contoh:

- Apakah cash flow positif?
- Apakah kewajiban masih aman?
- Apakah dana darurat cukup?
- Apakah pengeluaran terlalu tinggi?
- Apakah income terlalu tidak stabil?

---

## 5.2 Berapa uang yang aman saya gunakan?

**How much can I safely spend?**

Finora harus membantu user mengetahui batas pengeluaran fleksibel tanpa mengganggu:

- kewajiban;
- safety;
- goal;
- rencana wealth building.

---

## 5.3 Apa yang memperlambat perkembangan finansial saya?

**What is slowing down my financial progress?**

Contoh:

- lifestyle inflation;
- income stagnation;
- emergency fund rendah;
- debt burden tinggi;
- fixed cost terlalu besar;
- savings capacity rendah.

---

## 5.4 Di mana uang saya dapat bekerja lebih efektif?

**Where can my money work harder?**

Contoh:

- idle cash;
- surplus yang belum dialokasikan;
- skill development;
- business capital;
- productive assets;
- investasi;
- financial goal.

---

# 6. Prinsip Arsitektur Financial Intelligence

Gunakan arsitektur logika berikut:

```
Financial Data
      ↓
Financial Calculation Engine
      ↓
Financial Position / Financial Health
      ↓
Insight Detection Engine
      ↓
Insight Prioritization
      ↓
AI Explanation Layer
      ↓
Contextual UI / Notification
```

Pisahkan tanggung jawab antar layer.

---

## 6.1 Financial Data

Sumber data dapat berasal dari:

- transaksi;
- budget;
- portfolio;
- financial profile;
- financial goal;
- historical data;
- income;
- obligation;
- debt;
- emergency fund;
- investment exposure.

---

## 6.2 Financial Calculation Engine

Bertugas menghitung metric secara deterministic.

Jangan menggunakan Gemini untuk menghitung angka finansial utama.

---

## 6.3 Financial Position

Bertugas menentukan kondisi berdasarkan hasil calculation.

Contoh:

- cash flow sehat;
- safety buffer kurang;
- debt burden tinggi;
- wealth capacity meningkat.

---

## 6.4 Insight Detection Engine

Bertugas mendeteksi kejadian atau pola.

Contoh:

- spending spike;
- recurring surplus;
- income increase;
- goal delay.

---

## 6.5 Insight Prioritization

Bertugas menentukan insight mana yang layak ditampilkan.

Tidak semua insight boleh dikirim ke user.

---

## 6.6 AI Explanation Layer

Gemini hanya digunakan untuk:

- menjelaskan;
- menyederhanakan;
- membuat bahasa natural;
- memberi konteks.

Gemini tidak digunakan untuk:

- mengarang saldo;
- menentukan metric secara arbitrer;
- membuat health score random;
- menentukan fakta tanpa calculation engine;
- memberi rekomendasi investasi spesifik pada tahap awal.

---

# 7. PRIORITY ROADMAP

---

# P0 — FOUNDATION

Prioritas tertinggi.

Wajib dibangun sebelum fitur intelligence yang lebih kompleks.

---

## P0.1 Financial Profile

Financial Profile berbeda dengan Account Profile.

Account Profile existing tetap digunakan untuk:

- nama;
- username;
- email;
- avatar;
- preferences.

Financial Profile digunakan untuk memahami konteks keuangan user.

Data yang dapat dipertimbangkan:

### Personal Financial Context

- status:
  - mahasiswa;
  - karyawan;
  - freelancer;
  - wirausaha;
  - lainnya.

### Income

- monthly income;
- average income;
- income stability:
  - tetap;
  - relatif stabil;
  - fluktuatif.

### Expenses

- monthly essential expenses;
- recurring expenses.

### Obligations

- debt payments;
- cicilan;
- recurring obligations.

### Dependents

- jumlah tanggungan.

### Safety

- emergency fund.

### Goals

- primary financial goal;
- target amount;
- target date;
- time horizon.

### Risk

- risk tolerance;
- investment experience jika diperlukan.

---

## Progressive Profiling

Jangan membuat user harus mengisi seluruh Financial Profile sekaligus.

Gunakan progressive profiling.

Contoh:

Pada awal penggunaan hanya minta:

- status;
- income;
- essential expenses.

Kemudian minta data tambahan saat fitur membutuhkan:

- debt;
- goals;
- risk tolerance;
- investment horizon.

Financial Profile harus:

- editable;
- persistent;
- extensible;
- terintegrasi dengan Supabase existing;
- tidak membuat backend kedua.

---

## P0.2 Financial Calculation Engine

Buat layer calculation menggunakan TypeScript.

Fungsi harus:

- deterministic;
- reusable;
- testable;
- aman terhadap null;
- aman terhadap undefined;
- aman terhadap zero division.

Metric awal:

### Net Cash Flow

```
Net Cash Flow =
Income
- Expenses
- Debt Obligations
```

---

### Savings Capacity

Jumlah nominal yang masih dapat dialokasikan setelah kewajiban dan kebutuhan utama.

---

### Savings Rate

```
Savings Rate =
Savings / Income × 100%
```

Tangani kondisi income = 0.

---

### Expense-to-Income Ratio

```
Expense Ratio =
Monthly Expenses / Monthly Income × 100%
```

---

### Debt-to-Income Ratio

```
DTI =
Monthly Debt Payments / Monthly Income × 100%
```

---

### Emergency Fund Coverage

```
Emergency Fund Coverage =
Emergency Fund / Monthly Essential Expenses
```

Output berupa jumlah bulan.

---

### Budget Utilization

Gunakan budget dan actual spending existing.

---

### Recurring Surplus

Hitung surplus yang terjadi secara konsisten dari historical data.

---

### Available Liquidity

Hitung dana likuid yang tersedia.

---

### Discretionary Spending

Hitung bagian pengeluaran non-mandatory.

---

### Unallocated Cash

Dana yang belum memiliki tujuan finansial tertentu.

---

### Net Worth

```
Net Worth =
Total Assets - Total Liabilities
```

Implementasikan hanya jika data benar-benar tersedia.

Jangan membuat angka dummy.

---

# P1 — CORE USER VALUE

Dikerjakan setelah P0 stabil.

---

## P1.1 Safe-to-Spend / Adaptive Spending Cap

Ini merupakan salah satu fitur inti Finora.

Finora tidak menggunakan fixed percentage untuk Wants.

Konsep awal:

```
Safe-to-Spend =
Available Income
- Mandatory Obligations
- Safety Allocation
- Goal Allocation
```

Formula final harus menyesuaikan:

- actual data;
- historical spending;
- income stability;
- obligation;
- goal;
- safety requirement.

User tidak perlu melihat detail rumus setiap saat.

Tampilan sederhana:

```
Safe to Spend

Rp1.250.000

Aman digunakan sampai akhir bulan
tanpa mengganggu kewajiban dan target finansial.
```

Sediakan tombol:

```
Kenapa angka ini?
```

Detail explanation dapat menunjukkan:

- kewajiban;
- safety allocation;
- financial goal;
- spending history.

---

## P1.2 Financial Position / Financial Health

Jangan langsung menggunakan score 0–100 jika methodology belum tervalidasi.

Gunakan status seperti:

- Needs Attention
- Fair
- Stable
- Healthy
- Strong

Dimensi awal:

- Cash Flow Health
- Safety Buffer
- Debt Position
- Spending Control
- Savings Capacity
- Income Stability
- Wealth-Building Capacity

---

## Current Bottleneck

Financial Health harus bisa menunjukkan bottleneck utama.

Contoh:

- Emergency Fund
- High Debt Burden
- Income Instability
- Low Savings Capacity
- Excessive Fixed Cost
- Income Stagnation
- Lifestyle Inflation

Contoh output:

```
Financial Position

Stable

Current Bottleneck:
Emergency Fund

Dana darurat kamu saat ini baru
mencukupi sekitar 2,8 bulan kebutuhan utama.
```

---

# P2 — GOAL-BASED INTELLIGENCE

Jangan implementasikan sebelum P0 dan P1 stabil.

---

## P2.1 Financial Goals

Jenis goal:

- Emergency Fund
- Gadget / Laptop
- Education
- Travel
- Business Capital
- Skill Capital
- Investment Capital
- Asset Purchase
- Income Target
- Custom Goal

Field:

- name;
- goal type;
- target amount;
- current progress;
- target date;
- monthly allocation;
- projected completion.

---

## P2.2 Goal Projection

Hitung estimasi pencapaian goal berdasarkan alokasi saat ini.

---

## P2.3 Goal Trade-Off Analysis

Finora harus bisa menjelaskan trade-off.

Contoh:

```
Jika spending cap dinaikkan Rp500.000/bulan,
target Business Capital diperkirakan mundur
sekitar 2 bulan.
```

atau:

```
Jika tambahan income Rp1.000.000 dialokasikan
ke goal ini, target dapat tercapai sekitar
3 bulan lebih cepat.
```

User tetap mengambil keputusan akhir.

---

# P3 — INSIGHT ENGINE

---

## P3.1 Insight Detection Engine

Deteksi event secara deterministic.

Event awal:

- Spending Spike
- Income Increase
- Income Decline
- Negative Cash Flow
- Budget Pressure
- Lifestyle Inflation
- Recurring Surplus
- Emergency Fund Milestone
- Goal Delay
- Goal Acceleration
- Large Unallocated Cash
- Idle Cash
- Spending Pattern Shift
- Income Stagnation
- Savings Capacity Increase
- Financial Position Deterioration

Setiap event minimal memiliki:

```
eventType
metric
currentValue
baseline
period
severity
impact
confidence
relatedContext
```

---

## P3.2 Insight Prioritization

Tidak semua event menjadi insight user-facing.

Prioritization dapat mempertimbangkan:

- severity;
- financial impact;
- urgency;
- goal relevance;
- safety relevance;
- novelty;
- confidence;
- repetition.

Prinsip:

```
Importance != Percentage Change
```

Lebih baik:

```
Importance =
Impact on Financial Position
+ Impact on Safety
+ Impact on Goal
```

Contoh:

Spending naik 40% tetapi tetap aman mungkin lebih rendah priority dibanding spending naik 8% yang membuat cash flow negatif.

---

# P4 — PROACTIVE FINANCIAL ASSISTANT

Dikerjakan setelah Insight Engine tersedia.

Upgrade Smart Advisor existing menjadi:

**Contextual + Proactive Financial Assistant**

Assistant tidak hanya menunggu user bertanya.

Contoh insight:

```
Pendapatanmu meningkat, tetapi pengeluaran fleksibel
juga meningkat.

Sebagian besar kenaikan income dalam tiga bulan terakhir
belum berubah menjadi wealth-building capacity.
```

atau:

```
Dana daruratmu sudah mencapai target minimum.

Surplus bulan ini dapat mulai dipertimbangkan
untuk goal atau productive asset.
```

atau:

```
Pengeluaranmu sudah cukup efisien.

Penghematan tambahan hanya memberi ruang sekitar
Rp250.000 per bulan.

Income growth kemungkinan memberikan dampak
yang lebih besar terhadap perkembangan finansialmu.
```

Assistant menerima structured data dari Insight Engine.

Jangan biarkan Gemini menentukan fakta sendiri.

---

# P5 — WEALTH BUILDING

---

## P5.1 Wealth Allocation Engine

Ketika user memiliki surplus, Finora membantu memberikan pilihan alokasi.

Kategori dapat berupa:

- Safety Buffer
- Financial Goal
- Skill Capital
- Business Capital
- Productive Assets
- Long-Term Investment
- Unallocated Liquidity

Contoh:

```
Surplus bulan ini:
Rp4.000.000

Possible Allocation:

Safety Buffer
Rp500.000

Skill / Income Growth
Rp1.000.000

Financial Goal
Rp1.000.000

Long-Term Investment
Rp1.200.000

Unallocated
Rp300.000
```

Allocation tidak boleh fixed.

Pertimbangkan:

- financial safety;
- liquidity;
- debt;
- goal;
- income stability;
- risk profile;
- current bottleneck.

User selalu dapat override.

---

## P5.2 Income &amp; Wealth Growth Insights

Finora tidak boleh selalu menganggap expense cutting adalah solusi terbesar.

Contoh:

```
Pengeluaran kamu sudah cukup efisien.

Potensi penghematan tambahan hanya sekitar
Rp300.000 per bulan.

Peningkatan income sebesar 10% dapat menambah
sekitar Rp900.000 per bulan.
```

Insight dapat menyoroti:

- skill development;
- earning capacity;
- business capital;
- productive tools;
- ownership;
- asset acquisition.

Jangan menjanjikan ROI.

---

# P6 — INVESTMENT READINESS

Sebelum Investment Intelligence, lakukan readiness assessment.

Pertimbangkan:

- cash flow;
- emergency fund;
- debt burden;
- near-term obligations;
- income stability;
- goal;
- liquidity requirement;
- investable surplus;
- risk tolerance;
- risk capacity;
- investment horizon.

Output:

- Not Ready
- Build Safety First
- Limited Capacity
- Ready
- Strong Capacity

Jangan menggunakan shortcut:

```
Young = Aggressive Investor
```

Risk tolerance dan risk capacity harus diperlakukan berbeda.

---

# P7 — INVESTMENT INTELLIGENCE

Implementasikan hanya setelah Investment Readiness tersedia.

Scope jangka panjang:

- Investment Education
- Investment Simulation
- Asset-Class Comparison
- Risk Explanation
- Return Projection
- Portfolio Allocation
- Diversification Analysis
- Investment Exposure
- Portfolio Concentration
- Opportunity Cost
- Long-Term Projection

Jangan memberikan direct buy/sell recommendation sebelum methodology dan compliance dibahas.

---

# P8 — MARKET INTELLIGENCE

Prioritas terakhir.

Scope:

- market conditions;
- index movement;
- sector analysis;
- equity market context;
- macroeconomic context;
- asset news;
- portfolio impact;
- market risk.

Contoh insight yang diinginkan:

```
Jika posisi ini ditambah,
equity exposure akan meningkat
dari 32% menjadi 45%.

Sementara kebutuhan likuiditas
kamu masih relatif tinggi.
```

Bukan:

```
BUY STOCK X
```

---

# 8. Penempatan Insight di UI

Insight harus contextual.

Jangan menumpuk semuanya di Beranda.

---

# 8.1 Beranda

Fungsi:

**What Matters Now?**

Tampilkan maksimal:

- 1 sampai 3 insight prioritas.

Upgrade Smart Advisor existing menjadi:

**Finora Insights**

Kategori:

- Needs Attention
- Opportunity
- Progress

Contoh:

```
Needs Attention

Dana daruratmu masih berada
di bawah safety target.
```

atau:

```
Opportunity

Ada Rp1.400.000 surplus
yang belum dialokasikan.
```

Button:

```
Lihat Semua Insight
```

Beranda harus tetap clean.

---

# 8.2 Anggaran

Tampilkan:

- Safe-to-Spend;
- Budget Pressure;
- Spending Cap;
- Projected Over-Budget;
- Lifestyle Inflation;
- Remaining Discretionary Spending.

Contoh:

```
Safe to Spend

Rp780.000

Aman digunakan sampai akhir bulan.
```

---

# 8.3 Transaksi

Tampilkan pattern insight:

- unusual transaction;
- spending spike;
- recurring expense;
- merchant trend;
- category trend.

Jangan tampilkan financial advice panjang.

---

# 8.4 Portfolio

Tampilkan:

- asset allocation;
- bank/e-wallet/investment composition;
- liquidity;
- idle cash;
- unallocated assets;
- asset concentration;
- net worth movement;
- investment exposure.

---

# 8.5 Financial Health

Buat detail page baru jika diperlukan.

Isi:

- Financial Position
- Cash Flow
- Safety Buffer
- Debt Position
- Spending Control
- Income Stability
- Savings Capacity
- Wealth-Building Capacity
- Current Bottleneck
- Explanation

Dashboard hanya menampilkan summary.

---

# 8.6 Financial Goals

Tampilkan:

- progress;
- target;
- projected completion;
- required allocation;
- delay;
- acceleration;
- trade-off.

---

# 8.7 Notification

Gunakan notification hanya untuk high-value event.

Contoh:

- budget hampir habis;
- cash flow negatif;
- unusual spending;
- emergency fund milestone;
- goal milestone;
- large recurring surplus;
- significant income change;
- financial health deterioration.

Jangan spam user.

---

# 8.8 Insight Center

Belum wajib pada sprint awal.

Jika insight sudah banyak, dapat dibuat:

**Insight Center**

Kategori:

- Needs Attention
- Opportunity
- Progress
- Wealth Building

Insight Center tidak perlu menjadi tab utama.

Akses dari Beranda.

---

# 9. AI Interaction Design

Jangan menjadikan AI sebagai pusat UI Finora.

Financial Assistant harus muncul secara contextual.

Contoh lokasi:

- Beranda;
- Anggaran;
- Financial Health;
- Goals;
- Portfolio;
- Notification.

Jika nanti dibuat chatbot:

Gunakan nama seperti:

**Ask Finora**

Chatbot bukan satu-satunya cara user mendapatkan financial intelligence.

---

# 10. Current Sprint

Untuk implementasi sekarang, hanya kerjakan:

## P0

- Financial Profile
- Financial Calculation Engine

## P1

- Safe-to-Spend
- Financial Position / Financial Health
- UI summary
- Preparation untuk Insight Detection Engine

Jangan implementasikan sekarang:

- full Financial Goals;
- full Insight Detection;
- proactive assistant;
- wealth allocation;
- investment intelligence;
- market intelligence.

---

# 11. Langkah Sebelum Coding

Sebelum melakukan perubahan kode, lakukan audit.

Audit:

- project structure;
- architecture pattern;
- MVC implementation jika ada;
- Supabase schema;
- transaction model;
- budget model;
- portfolio model;
- user/profile model;
- Smart Advisor;
- Gemini service;
- notification service;
- navigation;
- global/shared state;
- service layer;
- hooks;
- types;
- existing financial calculation.

---

# 12. Output Audit

Sebelum coding, laporkan:

1. Arsitektur project saat ini.
2. File yang relevan.
3. Komponen yang dapat digunakan kembali.
4. Service yang dapat digunakan kembali.
5. Model/type yang dapat digunakan kembali.
6. Sumber data existing.
7. Data yang masih kurang.
8. Perubahan database yang diperlukan.
9. Dependency antarfitur.
10. Risiko implementasi.
11. Proposed implementation.
12. Urutan file yang akan diubah/dibuat.

Setelah audit selesai, lanjutkan implementasi P0 + P1 secara bertahap.

---

# 13. Implementation Rules

Jangan:

- rebuild aplikasi dari awal;
- mengganti struktur project tanpa alasan;
- menghapus fitur existing;
- membuat duplicate service;
- membuat duplicate state;
- membuat duplicate financial calculation;
- membuat backend kedua;
- mengganti Supabase architecture tanpa kebutuhan;
- mengganti navigation secara sembarangan;
- mengubah Expo SDK;
- upgrade dependency sembarangan;
- membuat dummy data yang terlihat seperti real financial result;
- membuat health score random;
- menggunakan Gemini sebagai calculation engine;
- membuat dashboard terlalu penuh;
- mengimplementasikan P2-P8 secara tidak sengaja.

Pertahankan:

- existing visual identity;
- existing color system;
- typography;
- navigation;
- reusable components;
- existing backend integration;
- existing working feature.

---

# 14. Methodology Validation

Jika threshold tertentu belum memiliki dasar yang cukup, jangan membuat angka arbitrary.

Contoh:

```
Savings Rate > 20% = Healthy
```

tidak boleh langsung digunakan tanpa methodology.

Jika methodology belum tersedia, tandai:

```
Methodology Pending Validation
```

Lebih baik menampilkan raw metric daripada membuat kesimpulan finansial yang tidak dapat dijelaskan.

Contoh:

Lebih aman:

```
Savings Rate:
18%
```

daripada:

```
Savings Health:
Excellent
```

jika threshold belum tervalidasi.

---

# 15. Testing

Jika environment memungkinkan, lakukan:

```
npx tsc --noEmit
```

Kemudian:

- existing lint;
- existing test;
- calculation unit test;
- Expo runtime test;
- Financial Profile persistence test;
- Safe-to-Spend test;
- Financial Health test.

---

# 16. Edge Cases

Minimal test:

- income = 0;
- expense &gt; income;
- no income;
- no budget;
- no transaction;
- no debt;
- no emergency fund;
- unstable income;
- partial Financial Profile;
- negative cash flow;
- negative balance;
- extremely high fixed cost;
- very high income;
- no goal;
- null value;
- undefined value;
- new user tanpa financial history.

---

# 17. Definition of Done — Current Sprint

Current sprint dianggap selesai jika:

1. Financial Profile sudah tersedia.
2. Financial Profile persistent.
3. Account Profile dan Financial Profile terpisah jelas.
4. Calculation Engine sudah deterministic.
5. Calculation Engine menggunakan actual data.
6. Safe-to-Spend berasal dari financial data nyata.
7. Financial Position explainable.
8. Financial Position tidak berasal dari random AI score.
9. UI menampilkan summary tanpa overload.
10. Existing Finora feature tetap berjalan.
11. Architecture siap digunakan oleh Insight Detection Engine.
12. Tidak ada known TypeScript error.
13. Edge cases utama sudah ditangani.
14. Testing result dilaporkan secara jujur.
15. Bagian yang belum tervalidasi ditandai jelas.

---

# 18. Instruksi Eksekusi

Mulai dari:

**AUDIT EXISTING PROJECT**

Jangan langsung melakukan perubahan massal.

Setelah audit:

1. Laporkan hasil audit.
2. Buat implementation plan.
3. Implementasikan P0 secara bertahap.
4. Verifikasi.
5. Implementasikan P1 secara bertahap.
6. Verifikasi kembali.
7. Laporkan hasil akhir.

Jika menemukan conflict antara specification ini dengan architecture existing, jangan langsung rewrite architecture.

Prioritaskan integrasi dengan sistem existing dan jelaskan trade-off yang ditemukan.

Jangan mengklaim fitur berhasil diuji jika pengujian sebenarnya tidak dapat dijalankan.