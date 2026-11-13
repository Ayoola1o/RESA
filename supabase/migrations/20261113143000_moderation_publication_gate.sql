-- Require the explicit property moderation decision in addition to the
-- existing identity, ownership, location, availability, media, and inspection gates.
create or replace function private.is_public_property(target_property_id text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.properties p
    join public.property_verifications v on v.property_id = p.id
    where p.id = target_property_id
      and p.listing_status in ('VERIFIED', 'ACTIVE', 'RESERVED', 'OCCUPIED')
      and coalesce(p.property_data ->> 'suspended', 'false') <> 'true'
      and p.property_data ->> 'moderationStatus' = 'APPROVED'
      and v.overall_status = 'PASSED'
      and v.owner_identity_status = 'PASSED'
      and v.location_status = 'PASSED'
      and v.authority_document_status = 'PASSED'
      and v.availability_status = 'PASSED'
      and v.media_status = 'PASSED'
      and v.inspection_status = 'PASSED'
      and exists (
        select 1 from public.property_documents d
        where d.property_id = p.id and d.status = 'APPROVED'
          and d.document_type in ('DEED_OF_ASSIGNMENT', 'CERTIFICATE_OF_OCCUPANCY', 'GOVERNORS_CONSENT', 'LETTER_OF_AUTHORITY', 'RECEIPT_OF_PURCHASE')
      )
      and exists (
        select 1 from public.property_media m
        where m.property_id = p.id and lower(coalesce(m.media_data ->> 'type', '')) = 'image'
      )
  );
$$;
revoke all on function private.is_public_property(text) from public;
grant execute on function private.is_public_property(text) to anon, authenticated;
