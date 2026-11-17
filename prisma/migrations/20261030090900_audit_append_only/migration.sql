-- ─────────────────────────────────────────────────────────────
-- Audit Log append-only enforcement (SPEC-0001 §3)
--
-- Menolak seluruh UPDATE dan DELETE pada tabel `audit_logs`.
-- Ini adalah jaminan auditabilitas di level database, bukan
-- hanya di level aplikasi.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION prevent_audit_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION
    'audit_logs bersifat append-only: operasi % ditolak', TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_no_update ON "audit_logs";

CREATE TRIGGER audit_logs_no_update
  BEFORE UPDATE OR DELETE ON "audit_logs"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_mutation();

-- Juga cegah TRUNCATE (tidak tertangkap trigger row-level)
DROP TRIGGER IF EXISTS audit_logs_no_truncate ON "audit_logs";

CREATE TRIGGER audit_logs_no_truncate
  BEFORE TRUNCATE ON "audit_logs"
  FOR EACH STATEMENT
  EXECUTE FUNCTION prevent_audit_mutation();
