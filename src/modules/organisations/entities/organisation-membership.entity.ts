/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\organisations\entities\organisation-membership.entity.ts
 *
 * Purpose:
 * Defines the relationship between a user, an organisation, and the
 * role assigned to that user within that organisation.
 *
 * Multi-tenant security principle:
 * A user's permissions are determined within the context of an
 * organisation membership. A user may belong to more than one
 * independent organisation and may have a different role in each.
 *
 * Example:
 *
 * User A
 *   ├── Organisation A → Administrator
 *   └── Organisation B → Analyst
 *
 * The existence and data of Organisation B must not be exposed to
 * Organisation A unless the user has an explicitly authorised
 * membership in Organisation B.
 */

import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Organisation } from './organisation.entity';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';

export enum OrganisationMembershipStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

@Entity('organisation_memberships')
@Index(
  'UQ_organisation_memberships_organisation_user',
  ['organisationId', 'userId'],
  { unique: true },
)
@Index('IDX_organisation_memberships_organisation', ['organisationId'])
@Index('IDX_organisation_memberships_user', ['userId'])
export class OrganisationMembership {
  /**
   * Unique membership identifier.
   *
   * A UUID is used to reduce predictable/sequential identifier
   * enumeration.
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Organisation to which this membership belongs.
   */
  @Column({
    name: 'organisation_id',
    type: 'uuid',
  })
  organisationId!: string;

  /**
   * User associated with this membership.
   */
  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId!: string;

  /**
   * Role assigned to the user within this organisation.
   *
   * IMPORTANT:
   * The role belongs to the membership context, not globally to
   * the user. The same user can therefore have different roles
   * in different organisations.
   */
  @Column({
    name: 'role_id',
    type: 'uuid',
  })
  roleId!: string;

  /**
   * Current status of this membership.
   */
  @Column({
    type: 'varchar',
    length: 30,
    default: OrganisationMembershipStatus.ACTIVE,
  })
  status!: OrganisationMembershipStatus;

  /**
   * Optional reporting relationship.
   *
   * This will allow a member to report to another member within
   * the same organisation.
   *
   * The service layer must ensure that the manager membership
   * belongs to the same organisation.
   */
  @Column({
    name: 'manager_membership_id',
    type: 'uuid',
    nullable: true,
  })
  managerMembershipId!: string | null;

  /**
   * Organisation relationship.
   */
  @ManyToOne(
    () => Organisation,
    {
      nullable: false,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'organisation_id',
  })
  organisation!: Organisation;

  /**
   * User relationship.
   */
  @ManyToOne(
    () => User,
    {
      nullable: false,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'user_id',
  })
  user!: User;

  /**
   * Role relationship.
   */
  @ManyToOne(
    () => Role,
    {
      nullable: false,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({
    name: 'role_id',
  })
  role!: Role;

  /**
   * Reporting manager relationship.
   *
   * The foreign-key constraint will be added/validated through
   * the migration after the complete organisational relationship
   * is established.
   */
  @ManyToOne(
    () => OrganisationMembership,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({
    name: 'manager_membership_id',
  })
  managerMembership!: OrganisationMembership | null;

  /**
   * Timestamp when the membership was created.
   */
  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;

  /**
   * Timestamp when the membership was last modified.
   */
  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt!: Date;

  /**
   * Soft-deletion timestamp.
   */
  @DeleteDateColumn({
    name: 'deleted_at',
    nullable: true,
  })
  deletedAt!: Date | null;
}