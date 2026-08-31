-- 업무 협조 요청 시스템 DB 스키마
-- 기획 문서(claude/업무협조요청시스템_기획문서_1차.md) 7장 기준

create extension if not exists "pgcrypto";

-- 7-1. teams
create table if not exists teams (
  id text primary key,
  name text not null
);

insert into teams (id, name) values
  ('marketing', '마케팅팀'),
  ('innovation', '혁신팀')
on conflict (id) do nothing;

-- 7-2. requests (공통 정보)
create table if not exists requests (
  id bigint generated always as identity primary key,
  request_no text not null unique, -- REQ-000001 형태의 표시용 번호
  team_id text not null references teams(id),
  requester_name text not null,
  request_type text not null check (request_type in (
    'new_product', 'product_change', 'popup', 'banner', 'package', 'etc', 'order_cancel'
  )),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_requests_team on requests(team_id);
create index if not exists idx_requests_status on requests(status);

-- 요청번호 자동 채번 (REQ-000001 형태)
create sequence if not exists request_no_seq;

create or replace function set_request_no()
returns trigger as $$
begin
  if new.request_no is null then
    new.request_no := 'REQ-' || lpad(nextval('request_no_seq')::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_request_no on requests;
create trigger trg_set_request_no
  before insert on requests
  for each row execute function set_request_no();

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_requests_updated_at on requests;
create trigger trg_requests_updated_at
  before update on requests
  for each row execute function set_updated_at();

-- 7-3. request_new_product (1:1)
create table if not exists request_new_product (
  request_id bigint primary key references requests(id) on delete cascade,
  product_code text not null,
  product_name text not null,
  is_taxable boolean not null,
  stock_type text not null check (stock_type in ('unlimited', 'by_stock')),
  stock_qty integer,
  bundle_unit integer not null,
  sale_period_type text not null check (sale_period_type in ('unlimited', 'fixed')),
  sale_start_date date,
  sale_end_date date,
  use_finance_fee boolean not null,
  description_file_url text
);

-- 7-4. pricing_tiers (1:N, 신규 상품 등록)
create table if not exists pricing_tiers (
  id bigint generated always as identity primary key,
  request_id bigint not null references requests(id) on delete cascade,
  min_qty integer not null,
  grade text not null check (grade in ('M', 'MS', 'MS+')),
  price numeric not null
);

-- 7-5. product_images (1:N)
create table if not exists product_images (
  id bigint generated always as identity primary key,
  request_id bigint not null references requests(id) on delete cascade,
  image_type text not null check (image_type in (
    'zoom', 'detail', 'thumbnail', 'list', 'list_group', 'product_type'
  )),
  file_url text not null
);

-- 7-6. product_change_items (1:N, 상품 정보 변경)
create table if not exists product_change_items (
  id bigint generated always as identity primary key,
  request_id bigint not null references requests(id) on delete cascade,
  target_product_code text not null,
  field_name text not null,
  old_value text,
  new_value text not null
);

-- 7-7. request_popup (1:1)
create table if not exists request_popup (
  request_id bigint primary key references requests(id) on delete cascade,
  expose_pc boolean not null default false,
  expose_mobile boolean not null default false,
  title text not null,
  expose_type text not null check (expose_type in ('always', 'period', 'period_time')),
  start_at timestamptz,
  end_at timestamptz,
  hide_today_option boolean not null default false,
  image_url text not null,
  link_url text
);

-- 7-8. request_banner (1:1)
create table if not exists request_banner (
  request_id bigint primary key references requests(id) on delete cascade,
  banner_type text not null check (banner_type in ('pre_login', 'main', 'middle')),
  title text not null,
  image_url text not null,
  link_url text
);

-- 7-9. request_package (1:1) / package_items (1:N)
create table if not exists request_package (
  request_id bigint primary key references requests(id) on delete cascade,
  product_name text not null,
  is_taxable boolean not null,
  stock_type text not null check (stock_type in ('unlimited', 'by_stock')),
  stock_qty integer,
  bundle_unit integer not null,
  sale_period_type text not null check (sale_period_type in ('unlimited', 'fixed')),
  sale_start_date date,
  sale_end_date date,
  use_finance_fee boolean not null,
  description_file_url text,
  total_price numeric not null
);

create table if not exists package_items (
  id bigint generated always as identity primary key,
  request_id bigint not null references requests(id) on delete cascade,
  product_code text not null,
  qty integer not null,
  allocated_price numeric not null
);

-- 기타 요청
create table if not exists request_etc (
  request_id bigint primary key references requests(id) on delete cascade,
  content text not null
);

-- 7-10. request_order_cancel (1:1, 혁신팀) / order_cancel_items (1:N)
create table if not exists request_order_cancel (
  request_id bigint primary key references requests(id) on delete cascade,
  reason text not null
);

create table if not exists order_cancel_items (
  id bigint generated always as identity primary key,
  request_id bigint not null references requests(id) on delete cascade,
  order_no text not null,
  vendor_code text not null,
  vendor_name text not null,
  item_no text not null,
  item_name text not null,
  qty integer not null
);

-- 공지사항 등록 요청 (1:1, 마케팅팀/혁신팀)
create table if not exists request_notice (
  request_id bigint primary key references requests(id) on delete cascade,
  title text not null,
  start_date date not null,
  end_date date not null
);

-- 메인 화면 "문의하기" 버튼으로 들어오는 문의/의견. 요청 시스템과 달리 팀/요청유형이 없고,
-- 저장 + 관리자 이메일 알림까지만 하고 상태값(대기/완료 등)은 따로 관리하지 않습니다.
create table if not exists inquiries (
  id bigint generated always as identity primary key,
  name text not null,
  contact text,
  content text not null,
  created_at timestamptz not null default now()
);

-- RLS는 우선 비활성 상태로 둡니다. 관리자 화면/조회 화면 모두
-- service_role 키를 쓰는 서버 API를 경유하므로, 별도 로그인 체계가
-- 붙기 전까지는 anon 키로 클라이언트에서 직접 테이블에 접근하지 않도록 주의합니다.
