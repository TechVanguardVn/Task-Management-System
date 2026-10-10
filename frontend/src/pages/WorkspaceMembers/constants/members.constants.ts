export const MEMBERS_TEXTS = {
  header: {
    title: 'Members',
    inviteBtn: 'Invite Member',
  },
  filter: {
    searchPlaceholder: 'Search members by name or email...',
    all: 'All',
    admin: 'Admin',
    member: 'Member',
    guest: 'Guest',
  },
  table: {
    userInfo: 'User Info',
    role: 'Role & Permissions',
    joinedDate: 'Joined Date',
    actions: 'Actions',
  },
  inviteModal: {
    title: 'Invite New Member',
    description: 'Add a new member to your workspace and assign their role.',
    emailLabel: 'Email Address',
    emailPlaceholder: "Enter colleague's email",
    roleLabel: 'Select Role',
    submitBtn: 'Send Invite',
    cancelBtn: 'Cancel',
    roles: {
      owner: {
        title: 'Owner',
        desc: 'Full control over the workspace, including billing and deletion.',
      },
      admin: {
        title: 'Admin',
        desc: 'Full access to manage workspace settings, billing, and members.',
      },
      member: {
        title: 'Member',
        desc: 'Can create and edit tasks, change status, and collaborate.',
      },
      guest: {
        title: 'Guest',
        desc: 'Read-only access. Can view tasks and add comments.',
      }
    }
  },
  changeRoleModal: {
    title: 'Change Member Role',
    roleLabel: 'Select New Role',
    submitBtn: 'Update Role',
    cancelBtn: 'Cancel'
  }
} as const
