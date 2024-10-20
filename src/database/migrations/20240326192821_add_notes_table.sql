-- migrate:up

create table notes (
  id text primary key not null default (uuid_v4()),
  name text not null,
  content text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at text
) strict, without rowid;

create trigger "notes_update_updated_at"
after update on notes
for each row
when new.updated_at = old.updated_at
begin
update notes
set updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
where id = old.id;
end

-- migrate:down
