import { pgTable, text, integer, boolean, serial, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  name: text('name'),
  role: text('role').notNull(), // 'admin', 'user', 'gate'
  depotId: text('depotId'),
  vatNumber: text('vatNumber'),
  address: text('address'),
  city: text('city'),
  zipCode: text('zipCode'),
  phone: text('phone'),
  contactPerson: text('contactPerson'),
  status: text('status').default('ACTIVE'), // 'ACTIVE', 'PENDING', 'REJECTED'
  must_change_password: boolean('must_change_password').default(false),
  temp_password_at: text('temp_password_at'),
  requested_at: text('requested_at'),
  reviewed_at: text('reviewed_at'),
  reviewed_by: text('reviewed_by'),
  rejection_reason: text('rejection_reason'),
  interested_depots: text('interested_depots'),
  notes: text('notes'),
  createdAt: text('createdAt').notNull(),
});

export const bookings = pgTable('bookings', {
  id: text('id').primaryKey(),
  userId: text('userId').references(() => users.id),
  depotId: text('depotId').notNull(),
  date: text('date').notNull(),
  time: text('time').notNull(),
  carrierName: text('carrierName').notNull(),
  licensePlate: text('licensePlate').notNull(),
  company: text('company'),
  phone: text('phone'),
  orderRef: text('orderRef'),
  orderRefScarico: text('orderRefScarico'),
  orderRefCarico: text('orderRefCarico'),
  notes: text('notes'),
  status: text('status').default('pending'), // 'pending', 'approved', 'rejected'
  gateStatus: text('gateStatus').default('expected'), // 'expected', 'arrived', 'completed'
  operationType: text('operationType'),
  pallets: integer('pallets').default(0),
  operationTypeScarico: text('operationTypeScarico'),
  palletsScarico: integer('palletsScarico').default(0),
  operationTypeCarico: text('operationTypeCarico'),
  palletsCarico: integer('palletsCarico').default(0),
  difficulty: text('difficulty').default('standard'),
  isEmergency: boolean('isEmergency').default(false),
  attachment: text('attachment'),
  arrivalPhoto: text('arrivalPhoto'),
  operationStartedAt: text('operationStartedAt'),
  completedAt: text('completedAt'),
  bay: text('bay'),
  createdAt: text('createdAt').notNull(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('userId').references(() => users.id),
  createdAt: text('createdAt').notNull(),
});

export const audit_logs = pgTable('audit_logs', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  timestamp: timestamp('timestamp').default(sql`CURRENT_TIMESTAMP`),
  userId: text('userId'),
  userEmail: text('userEmail'),
  userRole: text('userRole'),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entityId'),
  oldValue: text('oldValue'),
  newValue: text('newValue'),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  details: text('details'),
});

export const deposits = pgTable('deposits', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
});
