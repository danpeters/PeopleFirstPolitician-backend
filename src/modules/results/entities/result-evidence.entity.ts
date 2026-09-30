/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\results\entities\result-evidence.entity.ts
 *
 * Purpose:
 * - Stores metadata and secure storage references for evidence
 *   associated with a PollingUnitResult.
 *
 * Examples:
 * - Photograph of official result sheet.
 * - Scanned result document.
 * - Other authorised supporting evidence.
 *
 * Security:
 * - Actual files must not be stored as database binary data.
 * - storageKey must point to controlled/private file storage.
 * - Access to evidence must be authorised through the related result.
 * - Evidence records are retained for auditability.
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { PollingUnitResult } from './polling-unit-result.entity';

export enum ResultEvidenceType {
  RESULT_SHEET_PHOTO = 'result_sheet_photo',
  RESULT_SHEET_SCAN = 'result_sheet_scan',
  SUPPORTING_DOCUMENT = 'supporting_document',
}

@Entity('result_evidence')
@Index('IDX_result_evidence_result', ['pollingUnitResultId'])
@Index('IDX_result_evidence_uploaded_by', ['uploadedByUserId'])
@Index('IDX_result_evidence_type', ['evidenceType'])
export class ResultEvidence {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'polling_unit_result_id', type: 'uuid' })
  pollingUnitResultId!: string;

  @ManyToOne(() => PollingUnitResult, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'polling_unit_result_id' })
  pollingUnitResult!: PollingUnitResult;

  @Column({
    name: 'evidence_type',
    type: 'enum',
    enum: ResultEvidenceType,
  })
  evidenceType!: ResultEvidenceType;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName!: string;

  /**
   * Private object/file-storage key.
   *
   * This should not be treated as a public URL.
   */
  @Column({ name: 'storage_key', type: 'text' })
  storageKey!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 120 })
  mimeType!: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize!: string;

  /**
   * Cryptographic hash of the stored file.
   *
   * This supports evidence integrity verification.
   */
  @Column({ name: 'file_hash', type: 'varchar', length: 128 })
  fileHash!: string;

  @Column({ name: 'uploaded_by_user_id', type: 'uuid' })
  uploadedByUserId!: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'uploaded_by_user_id' })
  uploadedByUser!: User;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt!: Date;
}