import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import {
  setTeams,
  setCurrentTeam,
  setTeamMembers,
  addTeam,
  removeTeam,
  removeTeamMember,
  setLoading,
  setError,
} from '@/store/slices/teamsSlice';
import { addToast } from '@/store/slices/uiSlice';
import {
  createTeam,
  getTeams,
  getTeam,
  getTeamMembers,
  inviteTeamMember,
  deleteTeam as apiDeleteTeam,
  updateTeamMemberProfile,
  resetTeamMemberCredentials,
  updateTeamMember as apiUpdateTeamMember,
  removeTeamMember as apiRemoveTeamMember,
} from '@/services/teams.service';
import { Team, ApiError } from '@/types';
import { createTeamSchema, inviteMemberSchema, updateMemberProfileSchema, zodResolver } from '@/lib/validation';
import './TeamsAdmin.css';

interface CreateTeamForm {
  name: string;
  description: string;
}

interface InviteMemberForm {
  email: string;
}

interface EditMemberForm {
  memberId: string;
  name: string;
  email: string;
}

interface IssuedCredentials {
  email: string;
  temporaryPassword: string;
  memberName: string;
  issuedAt: string;
}

export const TeamsAdmin: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { teams, currentTeam, teamMembers, isLoading, error } = useSelector(
    (state: RootState) => state.teams
  );
  const [fetchedTeams, setFetchedTeams] = useState<Team[]>([]);

  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showInviteMemberModal, setShowInviteMemberModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const {
    register: registerCreateTeam,
    handleSubmit: handleCreateTeamSubmit,
    formState: { errors: createTeamErrors },
    reset: resetCreateTeamForm,
  } = useForm<z.infer<typeof createTeamSchema>>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: '', description: '' },
  });

  const {
    register: registerInviteMember,
    handleSubmit: handleInviteMemberSubmit,
    formState: { errors: inviteMemberErrors },
    reset: resetInviteMemberForm,
  } = useForm<z.infer<typeof inviteMemberSchema>>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: '' },
  });

  const {
    register: registerEditMember,
    handleSubmit: handleEditMemberSubmit,
    formState: { errors: editMemberErrors },
    reset: resetEditMemberForm,
  } = useForm<z.infer<typeof updateMemberProfileSchema>>({
    resolver: zodResolver(updateMemberProfileSchema),
    defaultValues: { name: '', email: '' },
  });

  const [createTeamForm, setCreateTeamForm] = useState<CreateTeamForm>({
    name: '',
    description: '',
  });
  const [inviteMemberForm, setInviteMemberForm] = useState<InviteMemberForm>({
    email: '',
  });
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [newMemberRole, setNewMemberRole] = useState<'LEAD' | 'MEMBER'>('MEMBER');
  const [editMemberForm, setEditMemberForm] = useState<EditMemberForm>({
    memberId: '',
    name: '',
    email: '',
  });
  const [issuedCredentials, setIssuedCredentials] = useState<IssuedCredentials | null>(null);

  const loadTeams = React.useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const response = await getTeams();
      const nextTeams = response?.teams ?? [];
      setFetchedTeams(nextTeams);
      dispatch(setTeams(nextTeams));
    } catch (err) {
      const message = (err as ApiError).message || 'Failed to load teams';
      dispatch(setError(message));
      dispatch(addToast({
        type: 'error',
        message,
        duration: 3000,
      }));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  // Load teams on component mount
  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const loadTeamMembers = React.useCallback(async (teamId: string) => {
    try {
      dispatch(setLoading(true));
      const [teamResult, membersResult] = await Promise.allSettled([
        getTeam(teamId),
        getTeamMembers(teamId),
      ]);

      if (teamResult.status === 'rejected') {
        throw teamResult.reason;
      }

      if (membersResult.status === 'rejected') {
        throw membersResult.reason;
      }

      dispatch(setCurrentTeam(teamResult.value));
      dispatch(setTeamMembers(membersResult.value?.members ?? []));
    } catch (err) {
      const message = (err as ApiError).message || 'Failed to load team details';
      dispatch(setError(message));
      dispatch(addToast({
        type: 'error',
        message,
        duration: 3000,
      }));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const handleDeleteTeam = async () => {
    if (!currentTeam) return;

    if (!window.confirm(`Delete team "${currentTeam.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      dispatch(setLoading(true));
      await apiDeleteTeam(currentTeam.id);
      dispatch(removeTeam(currentTeam.id));
      setFetchedTeams((prev) => prev.filter((team) => team.id !== currentTeam.id));
      dispatch(addToast({
        type: 'success',
        message: 'Team deleted successfully',
        duration: 3000,
      }));
    } catch (err) {
      const message = (err as ApiError).message || 'Failed to delete team';
      dispatch(setError(message));
      dispatch(addToast({
        type: 'error',
        message,
        duration: 3000,
      }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  

  const handleCreateTeam = async (data: z.infer<typeof createTeamSchema>) => {
    try {
      dispatch(setLoading(true));
      const response = await createTeam({
        name: data.name,
        description: data.description || undefined,
      });
      
      if (!response?.team || !response?.membership) {
        throw new Error('Invalid response from server: missing team or membership data');
      }
      
      const newTeam: Team = {
        id: response.team.id,
        name: response.team.name,
        description: response.team.description,
        role: 'LEAD',
        createdAt: response.team.createdAt,
        updatedAt: response.team.updatedAt,
        joinedAt: response.membership.acceptedAt,
      };
      
      dispatch(addTeam(newTeam));
      setFetchedTeams((prev) => [...prev, newTeam]);
      dispatch(addToast({
        type: 'success',
        message: `Team "${createTeamForm.name}" created successfully!`,
        duration: 3000,
      }));

      resetCreateTeamForm();
      setCreateTeamForm({ name: '', description: '' });
      setShowCreateTeamModal(false);
      
      // Load the new team's details
      if (response?.team?.id) {
        await loadTeamMembers(response.team.id);
      }
    } catch (err) {
      const message = (err as ApiError).message || 'Failed to create team';
      dispatch(setError(message));
      dispatch(addToast({
        type: 'error',
        message,
        duration: 3000,
      }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleInviteMember = async (data: z.infer<typeof inviteMemberSchema>) => {
    if (!currentTeam) {
      dispatch(addToast({
        type: 'error',
        message: 'No team selected',
        duration: 3000,
      }));
      return;
    }

    try {
      dispatch(setLoading(true));
      const response = await inviteTeamMember(currentTeam.id, {
        email: data.email,
      });

      await loadTeamMembers(currentTeam.id);

      if (response.temporaryCredentials) {
        const memberName = response.member?.email || inviteMemberForm.email;
        setIssuedCredentials({
          email: response.temporaryCredentials.email,
          temporaryPassword: response.temporaryCredentials.temporaryPassword,
          memberName,
          issuedAt: new Date().toISOString(),
        });
        dispatch(addToast({
          type: 'success',
          message: `New credentials: ${response.temporaryCredentials.email} / ${response.temporaryCredentials.temporaryPassword}`,
          duration: 7000,
        }));
      }
      
      dispatch(addToast({
        type: 'success',
        message: response.message,
        duration: 3000,
      }));

      resetInviteMemberForm();
      setInviteMemberForm({ email: '' });
      setShowInviteMemberModal(false);
    } catch (err) {
      const message = (err as ApiError).message || 'Failed to send invitation';
      dispatch(setError(message));
      dispatch(addToast({
        type: 'error',
        message,
        duration: 3000,
      }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUpdateMemberRole = async (memberId: string) => {
    if (!currentTeam) return;

    try {
      dispatch(setLoading(true));
      await apiUpdateTeamMember(currentTeam.id, memberId, {
        role: newMemberRole,
      });

      // Reload team members
      await loadTeamMembers(currentTeam.id);

      dispatch(addToast({
        type: 'success',
        message: `Member role updated to ${newMemberRole}`,
        duration: 3000,
      }));

      setSelectedMemberId(null);
    } catch (err) {
      const message = (err as ApiError).message || 'Failed to update member role';
      dispatch(setError(message));
      dispatch(addToast({
        type: 'error',
        message,
        duration: 3000,
      }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!currentTeam) return;

    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      dispatch(setLoading(true));
      await apiRemoveTeamMember(currentTeam.id, memberId);

      dispatch(removeTeamMember(memberId));
      dispatch(addToast({
        type: 'success',
        message: 'Member removed from team',
        duration: 3000,
      }));
    } catch (err) {
      const message = (err as ApiError).message || 'Failed to remove member';
      dispatch(setError(message));
      dispatch(addToast({
        type: 'error',
        message,
        duration: 3000,
      }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleOpenEditMember = (memberId: string, currentName: string, currentEmail: string) => {
    resetEditMemberForm({ name: currentName, email: currentEmail });
    setEditMemberForm({
      memberId,
      name: currentName,
      email: currentEmail,
    });
    setShowEditMemberModal(true);
  };

  const handleEditMember = async (data: z.infer<typeof updateMemberProfileSchema>) => {
    if (!currentTeam || !editMemberForm.memberId) return;

    try {
      dispatch(setLoading(true));
      await updateTeamMemberProfile(currentTeam.id, editMemberForm.memberId, {
        name: data.name!,
        email: data.email!,
      });
      await loadTeamMembers(currentTeam.id);
      setShowEditMemberModal(false);
      dispatch(addToast({
        type: 'success',
        message: 'Member profile updated',
        duration: 3000,
      }));
    } catch (err) {
      const message = (err as ApiError).message || 'Failed to update member details';
      dispatch(setError(message));
      dispatch(addToast({
        type: 'error',
        message,
        duration: 3000,
      }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleResetCredentials = async (memberId: string) => {
    if (!currentTeam) return;

    if (!window.confirm('Reset this member credentials and generate a new temporary password?')) {
      return;
    }

    try {
      dispatch(setLoading(true));
      const response = await resetTeamMemberCredentials(currentTeam.id, memberId);
      const member = teamMembers.find((item) => item.userId === memberId);
      setIssuedCredentials({
        email: response.credentials.email,
        temporaryPassword: response.credentials.temporaryPassword,
        memberName: member?.name || response.credentials.email,
        issuedAt: new Date().toISOString(),
      });
      dispatch(addToast({
        type: 'success',
        message: `Credentials reset: ${response.credentials.email} / ${response.credentials.temporaryPassword}`,
        duration: 8000,
      }));
    } catch (err) {
      const message = (err as ApiError).message || 'Failed to reset member credentials';
      dispatch(setError(message));
      dispatch(addToast({
        type: 'error',
        message,
        duration: 3000,
      }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const copyIssuedCredentials = async () => {
    if (!issuedCredentials) return;

    const text = `Email: ${issuedCredentials.email}\nTemporary Password: ${issuedCredentials.temporaryPassword}`;
    try {
      await navigator.clipboard.writeText(text);
      dispatch(addToast({
        type: 'success',
        message: 'Credentials copied to clipboard',
        duration: 2500,
      }));
    } catch {
      dispatch(addToast({
        type: 'error',
        message: 'Could not copy credentials. Please copy manually.',
        duration: 2500,
      }));
    }
  };

  const visibleTeams = fetchedTeams.length > 0 ? fetchedTeams : teams;
  const currentTeamRole = currentTeam?.role;
  const canCreateTeam =
    visibleTeams.length === 0 ||
    visibleTeams.some((team) => team.role === 'LEAD' || team.role === 'MANAGER');
  const canManageTeam = currentTeamRole === 'MANAGER' || currentTeamRole === 'LEAD';
  const canInviteMembers = currentTeamRole === 'LEAD';
  const canChangeRoles = currentTeamRole === 'MANAGER';

  return (
    <div className="teams-admin">
      <div className="teams-admin-header">
        <div>
          <h1>Teams</h1>
          <p className="teams-subtitle">
            {canCreateTeam
              ? 'Leader mode: manage member accounts, profile details, and credentials.'
              : 'Member mode: view your team roster and collaboration updates.'}
          </p>
        </div>
        {canCreateTeam && (
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateTeamModal(true)}
          >
            + Create Team
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="teams-loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      )}

      <div className="teams-container">
        <div className="teams-list">
          <h2>Your Teams</h2>
          {visibleTeams.length === 0 ? (
            <div className="empty-state">
              {canCreateTeam ? (
                <>
                  <p className="empty-state-title">No teams yet</p>
                  <p>Create your first team to start inviting members and tracking collaboration.</p>
                  <button
                    className="btn btn-primary empty-state-cta"
                    onClick={() => setShowCreateTeamModal(true)}
                  >
                    Create Your First Team
                  </button>
                </>
              ) : (
                <>
                  <p className="empty-state-title">No teams assigned</p>
                  <p>You can view team members once a leader adds you to a team.</p>
                </>
              )}
            </div>
          ) : (
            <div className="teams-grid">
              {visibleTeams.map((team) => (
                <div
                  key={team.id}
                  className={`team-card ${
                    currentTeam?.id === team.id ? 'active' : ''
                  }`}
                  onClick={() => loadTeamMembers(team.id)}
                >
                  <div className="team-card-header">
                    <h3>{team.name}</h3>
                    <span className="team-role-badge">{team.role}</span>
                  </div>
                  {team.description && (
                    <p className="team-description">{team.description}</p>
                  )}
                  <div className="team-meta">
                    <small>
                      Joined: {new Date(team.joinedAt || team.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {currentTeam && (
          <div className="team-details">
            <div className="team-details-header">
              <div>
                <h2>{currentTeam.name}</h2>
                {currentTeam.description && (
                  <p className="team-description">{currentTeam.description}</p>
                )}
              </div>
              <div className="team-details-actions">
                {canInviteMembers && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowInviteMemberModal(true)}
                  >
                    + Add Member Account
                  </button>
                )}
                {(currentTeamRole === 'LEAD' || currentTeamRole === 'MANAGER') && (
                  <button
                    className="btn btn-danger"
                    onClick={handleDeleteTeam}
                  >
                    Delete Team
                  </button>
                )}
              </div>
            </div>

            <div className="team-members">
              {issuedCredentials && (
                <div className="credentials-card" role="status">
                  <div className="credentials-card-header">
                    <h4>Latest Issued Member Credentials</h4>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setIssuedCredentials(null)}
                    >
                      Dismiss
                    </button>
                  </div>
                  <p className="credentials-card-meta">
                    For {issuedCredentials.memberName} • {new Date(issuedCredentials.issuedAt).toLocaleString()}
                  </p>
                  <div className="credentials-values">
                    <p>
                      <span className="credential-label">Email</span>
                      <span className="credential-value">{issuedCredentials.email}</span>
                    </p>
                    <p>
                      <span className="credential-label">Temporary Password</span>
                      <span className="credential-value credential-secret">{issuedCredentials.temporaryPassword}</span>
                    </p>
                  </div>
                  <p className="credentials-card-note">Store this securely. The temporary password is shown only when issued or reset.</p>
                  <button type="button" className="btn btn-primary btn-sm" onClick={copyIssuedCredentials}>
                    Copy Credentials
                  </button>
                </div>
              )}

              <h3>Team Members ({teamMembers.length})</h3>
              {teamMembers.length === 0 ? (
                <div className="empty-state">
                  <p>No members yet</p>
                </div>
              ) : (
                <div className="members-table">
                  <div className="table-header">
                    <div className="col-name">Name</div>
                    <div className="col-email">Email</div>
                    <div className="col-role">Role</div>
                    {canManageTeam && <div className="col-actions">Manage</div>}
                  </div>
                  {teamMembers.map((member) => (
                    <div key={member.userId} className="table-row">
                      <div className="col-name">{member.name}</div>
                      <div className="col-email">{member.email}</div>
                      <div className="col-role">
                        {canChangeRoles && member.userId !== user?.id ? (
                          <select
                            value={member.role}
                            onChange={(e) => {
                              setSelectedMemberId(member.userId);
                              setNewMemberRole(e.target.value as 'LEAD' | 'MEMBER');
                            }}
                            onBlur={() => {
                              if (selectedMemberId === member.userId) {
                                handleUpdateMemberRole(member.userId);
                              }
                            }}
                            className="role-select"
                          >
                            <option value="LEAD">LEAD</option>
                            <option value="MEMBER">MEMBER</option>
                          </select>
                        ) : (
                          <span className="role-badge">{member.role}</span>
                        )}
                      </div>
                      {canManageTeam && member.userId !== user?.id && (
                        <div className="col-actions">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEditMember(member.userId, member.name, member.email)}
                          >
                            Edit
                          </button>
                          {member.role === 'MEMBER' && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleResetCredentials(member.userId)}
                            >
                              Reset Credentials
                            </button>
                          )}
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveMember(member.userId)}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Edit Member Modal */}
                  {showEditMemberModal && (
                    <div className="modal-overlay" onClick={() => setShowEditMemberModal(false)}>
                      <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                          <h2>Edit Member Details</h2>
                          <button
                            className="modal-close"
                            onClick={() => setShowEditMemberModal(false)}
                          >
                            ×
                          </button>
                        </div>
                        <form onSubmit={handleEditMemberSubmit(handleEditMember)}>
                          <div className="form-group">
                            <label htmlFor="edit-member-name">Name *</label>
                            <input
                              id="edit-member-name"
                              type="text"
                              className={`form-input${editMemberErrors.name ? ' form-input-error' : ''}`}
                              {...registerEditMember('name')}
                            />
                            {editMemberErrors.name && <span className="form-error">{editMemberErrors.name.message}</span>}
                          </div>
                          <div className="form-group">
                            <label htmlFor="edit-member-email">Email *</label>
                            <input
                              id="edit-member-email"
                              type="email"
                              className={`form-input${editMemberErrors.email ? ' form-input-error' : ''}`}
                              {...registerEditMember('email')}
                            />
                            {editMemberErrors.email && <span className="form-error">{editMemberErrors.email.message}</span>}
                          </div>
                          <div className="modal-actions">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setShowEditMemberModal(false)}
                            >
                              Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={isLoading}>
                              {isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            <div className="team-chat">
              <div className="team-chat-header">
                <h3>Project Follow-up Chat</h3>
              </div>
              <div className="empty-state">
                <p>Follow-up chat is temporarily unavailable. You can still manage members and delete this team here.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateTeamModal && (
        <div className="modal-overlay" onClick={() => setShowCreateTeamModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Team</h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateTeamModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateTeamSubmit(handleCreateTeam)}>
              <div className="form-group">
                <label htmlFor="team-name">Team Name *</label>
                <input
                  id="team-name"
                  type="text"
                  className={`form-input${createTeamErrors.name ? ' form-input-error' : ''}`}
                  placeholder="e.g., Product Team"
                  {...registerCreateTeam('name')}
                />
                {createTeamErrors.name && <span className="form-error">{createTeamErrors.name.message}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="team-description">Description</label>
                <textarea
                  id="team-description"
                  className="form-textarea"
                  placeholder="Team description (optional)"
                  rows={3}
                  {...registerCreateTeam('description')}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateTeamModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteMemberModal && (
        <div className="modal-overlay" onClick={() => setShowInviteMemberModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Member Account</h2>
              <button
                className="modal-close"
                onClick={() => setShowInviteMemberModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleInviteMemberSubmit(handleInviteMember)}>
              <div className="form-group">
                <label htmlFor="member-email">Email *</label>
                <input
                  id="member-email"
                  type="email"
                  className={`form-input${inviteMemberErrors.email ? ' form-input-error' : ''}`}
                  placeholder="member@example.com"
                  {...registerInviteMember('email')}
                />
                {inviteMemberErrors.email && <span className="form-error">{inviteMemberErrors.email.message}</span>}
              </div>
              <div className="form-info">
                <p>
                  <strong>Role:</strong> Member accounts are provisioned automatically.
                </p>
                <p>
                  <strong>Credentials:</strong> A temporary password is generated once and shown after creation.
                </p>
              </div>
              <div className="form-info alert-info">
                <p>Share the generated credentials securely. Members can sign in immediately after creation.</p>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowInviteMemberModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Member Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsAdmin;
