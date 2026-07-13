import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import {
  setTeams,
  setCurrentTeam,
  setTeamMembers,
  addTeam,
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
  getPendingInvitations,
  updateTeamMember as apiUpdateTeamMember,
  removeTeamMember as apiRemoveTeamMember,
} from '@/services/teams.service';
import type { TeamInvitation } from '@/services/teams.service';
import { Team, ApiError } from '@/types';
import './TeamsAdmin.css';

interface CreateTeamForm {
  name: string;
  description: string;
}

interface InviteMemberForm {
  email: string;
  role: 'LEAD' | 'MEMBER';
}

export const TeamsAdmin: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { teams, currentTeam, teamMembers, isLoading, error } = useSelector(
    (state: RootState) => state.teams
  );

  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showInviteMemberModal, setShowInviteMemberModal] = useState(false);
  const [createTeamForm, setCreateTeamForm] = useState<CreateTeamForm>({
    name: '',
    description: '',
  });
  const [inviteMemberForm, setInviteMemberForm] = useState<InviteMemberForm>({
    email: '',
    role: 'MEMBER',
  });
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [newMemberRole, setNewMemberRole] = useState<'LEAD' | 'MEMBER'>('MEMBER');

  const loadTeams = React.useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const response = await getTeams();
      dispatch(setTeams(response?.teams ?? []));
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
      const [teamData, membersData] = await Promise.all([
        getTeam(teamId),
        getTeamMembers(teamId),
      ]);
      dispatch(setCurrentTeam(teamData));
      dispatch(setTeamMembers(membersData?.members ?? []));
      
      // Load pending invitations for this team
      const invitationsData = await getPendingInvitations();
      setPendingInvitations((invitationsData?.invitations ?? []).filter(inv => inv.teamId === teamId));
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

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createTeamForm.name.trim()) {
      dispatch(addToast({
        type: 'error',
        message: 'Team name is required',
        duration: 3000,
      }));
      return;
    }

    try {
      dispatch(setLoading(true));
      const response = await createTeam({
        name: createTeamForm.name,
        description: createTeamForm.description || undefined,
      });
      
      if (!response?.team || !response?.membership) {
        throw new Error('Invalid response from server: missing team or membership data');
      }
      
      const newTeam: Team = {
        id: response.team.id,
        name: response.team.name,
        description: response.team.description,
        role: 'MANAGER',
        createdAt: response.team.createdAt,
        updatedAt: response.team.updatedAt,
        joinedAt: response.membership.acceptedAt,
      };
      
      dispatch(addTeam(newTeam));
      dispatch(addToast({
        type: 'success',
        message: `Team "${createTeamForm.name}" created successfully!`,
        duration: 3000,
      }));

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

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentTeam) {
      dispatch(addToast({
        type: 'error',
        message: 'No team selected',
        duration: 3000,
      }));
      return;
    }

    if (!inviteMemberForm.email.trim()) {
      dispatch(addToast({
        type: 'error',
        message: 'Email is required',
        duration: 3000,
      }));
      return;
    }

    try {
      dispatch(setLoading(true));
      const response = await inviteTeamMember(currentTeam.id, {
        email: inviteMemberForm.email,
        role: inviteMemberForm.role,
      });
      
      // Add to pending invitations list
      if (response?.invitation) {
        setPendingInvitations(prev => [...prev, response.invitation]);
      }
      
      dispatch(addToast({
        type: 'success',
        message: `Invitation sent to ${inviteMemberForm.email} as ${inviteMemberForm.role}!`,
        duration: 3000,
      }));

      setInviteMemberForm({ email: '', role: 'MEMBER' });
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

  const canManageTeam = currentTeam?.role === 'MANAGER' || currentTeam?.role === 'LEAD';
  const canChangeRoles = currentTeam?.role === 'MANAGER';

  return (
    <div className="teams-admin">
      <div className="teams-admin-header">
        <h1>Teams Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateTeamModal(true)}
        >
          + Create Team
        </button>
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
          {teams.length === 0 ? (
            <div className="empty-state">
              <p>No teams yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="teams-grid">
              {teams.map((team) => (
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
              {canManageTeam && (
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowInviteMemberModal(true)}
                >
                  + Invite Member
                </button>
              )}
            </div>

            {pendingInvitations.length > 0 && (
              <div className="pending-invitations">
                <h3>Pending Invitations ({pendingInvitations.length})</h3>
                <div className="invitations-list">
                  {pendingInvitations.map((invitation) => (
                    <div key={invitation.id} className="invitation-item">
                      <div className="invitation-info">
                        <span className="invitation-email">{invitation.email}</span>
                        <span className="invitation-role">{invitation.role}</span>
                        <span className="invitation-status">Pending</span>
                      </div>
                      <small>Expires: {new Date(invitation.expiresAt).toLocaleDateString()}</small>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="team-members">
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
                    {canManageTeam && <div className="col-actions">Actions</div>}
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
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveMember(member.userId)}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
            <form onSubmit={handleCreateTeam}>
              <div className="form-group">
                <label htmlFor="team-name">Team Name *</label>
                <input
                  id="team-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g., Product Team"
                  value={createTeamForm.name}
                  onChange={(e) =>
                    setCreateTeamForm({ ...createTeamForm, name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="team-description">Description</label>
                <textarea
                  id="team-description"
                  className="form-textarea"
                  placeholder="Team description (optional)"
                  rows={3}
                  value={createTeamForm.description}
                  onChange={(e) =>
                    setCreateTeamForm({
                      ...createTeamForm,
                      description: e.target.value,
                    })
                  }
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
              <h2>Invite Team Member</h2>
              <button
                className="modal-close"
                onClick={() => setShowInviteMemberModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleInviteMember}>
              <div className="form-group">
                <label htmlFor="member-email">Email *</label>
                <input
                  id="member-email"
                  type="email"
                  className="form-input"
                  placeholder="member@example.com"
                  value={inviteMemberForm.email}
                  onChange={(e) =>
                    setInviteMemberForm({ ...inviteMemberForm, email: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="member-role">Role *</label>
                <select
                  id="member-role"
                  className="form-select"
                  value={inviteMemberForm.role}
                  onChange={(e) =>
                    setInviteMemberForm({
                      ...inviteMemberForm,
                      role: e.target.value as 'LEAD' | 'MEMBER',
                    })
                  }
                >
                  <option value="MEMBER">Member</option>
                  <option value="LEAD">Team Lead</option>
                </select>
              </div>
              <div className="form-info">
                <p>
                  <strong>Member:</strong> Can view team meetings and action items
                </p>
                <p>
                  <strong>Team Lead:</strong> Can also invite members and manage their tasks
                </p>
              </div>
              <div className="form-info alert-info">
                <p>An invitation will be sent to the email address. They will need to accept it to join the team.</p>
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
                  {isLoading ? 'Sending...' : 'Send Invitation'}
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
