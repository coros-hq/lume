import { useState, useEffect } from 'react'
import React from 'react'
import { defineAction } from './core/defineAction'
import { defineComponent } from './core/defineComponent'
import { AssistantWidget } from './components/AssistantWidget'
import { LumeProvider, useLume } from './context/LumeContext'

type Page = 'dashboard' | 'analytics' | 'billing' | 'settings' | 'team' | 'integrations'

// ── Mock data ─────────────────────────────────────────────────────

const MOCK_USER = {
  name: 'Alex Johnson',
  email: 'alex@acme.co',
  plan: 'Pro',
  memberSince: 'March 2023',
  nextBilling: 'May 14, 2025',
  amount: '$49.00',
  usage: 78,
}

const MOCK_TEAM_INITIAL = [
  { name: 'Alex Johnson', email: 'alex@acme.co',  role: 'admin',  avatar: 'AJ', status: 'active'  },
  { name: 'Sara Chen',    email: 'sara@acme.co',   role: 'admin',  avatar: 'SC', status: 'active'  },
  { name: 'Mike Torres',  email: 'mike@acme.co',   role: 'viewer', avatar: 'MT', status: 'active'  },
  { name: 'Priya Nair',   email: 'priya@acme.co',  role: 'viewer', avatar: 'PN', status: 'pending' },
]

const knowledgeBase = [
  {
    title: 'Billing and payments',
    content: `
      Your subscription renews automatically every month on the date you signed up.
      We accept Visa, Mastercard, and PayPal.
      To update your payment method go to Settings → Billing.
      If a payment fails we retry 3 times over 5 days before cancelling.
      You can download invoices from Settings → Billing → Invoice history.
      Annual plans get a 20% discount compared to monthly billing.
    `,
  },
  {
    title: 'Resetting your password',
    content: `
      To reset your password click Forgot Password on the login screen.
      You will receive an email with a reset link valid for 24 hours.
      If you don't receive the email check your spam folder.
      Passwords must be at least 8 characters and include a number.
    `,
  },
  {
    title: 'Exporting your data',
    content: `
      You can export all your data as a CSV from Settings → Export.
      Exports are processed in the background and emailed to you when ready.
      Large exports may take up to 10 minutes.
      You can export analytics, team activity, and billing history separately.
    `,
  },
  {
    title: 'Team management',
    content: `
      You can invite team members from Settings → Team.
      Admins can manage billing, integrations, and invite other members.
      Viewers can see dashboards and analytics but cannot make changes.
      You can remove a team member at any time from the Team page.
      The Pro plan supports up to 10 team members. The Business plan is unlimited.
    `,
  },
  {
    title: 'Integrations',
    content: `
      Acme connects with Slack, Notion, GitHub, and Zapier.
      To set up an integration go to the Integrations page.
      Slack integration sends you daily digest reports and alerts.
      GitHub integration tracks deploy events in your analytics.
      API keys can be generated from Settings → API.
    `,
  },
  {
    title: 'Analytics and reporting',
    content: `
      The Analytics page shows traffic, conversions, and retention over time.
      You can filter by date range, country, and device type.
      Reports can be scheduled to be emailed weekly or monthly.
      Data is updated every 15 minutes. Historical data goes back 12 months.
    `,
  },
]

// ── Shared UI primitives ──────────────────────────────────────────

const ACCENT = '#6366f1'

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12, padding: '12px 14px',
    }}>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12,
    }}>
      <span style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
      <span style={{ color: 'rgba(255,255,255,0.85)' }}>{value}</span>
    </div>
  )
}

function Pill({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      fontSize: 10, padding: '2px 8px', borderRadius: 20,
      background: `${color}22`, color, fontWeight: 500, textTransform: 'capitalize',
    }}>
      {children}
    </span>
  )
}

// ── Pages ─────────────────────────────────────────────────────────

const PAGES: Page[] = ['dashboard', 'analytics', 'billing', 'settings', 'team', 'integrations']

const TEST_PROMPTS = [
  { label: 'Action',    text: 'take me to analytics' },
  { label: 'Action',    text: 'invite sara@test.com as viewer' },
  { label: 'Action',    text: 'remove priya@acme.co from the team' },
  { label: 'Action',    text: 'schedule a weekly report to me@acme.co' },
  { label: 'Action',    text: 'export my billing data' },
  { label: 'Component', text: 'what is my billing status?' },
  { label: 'Component', text: 'show my profile' },
  { label: 'Component', text: 'how much of my plan have I used?' },
  { label: 'Component', text: 'who is on my team?' },
  { label: 'RAG',       text: 'how do I reset my password?' },
  { label: 'RAG',       text: 'what payment methods do you accept?' },
  { label: 'RAG',       text: 'how do I set up Slack?' },
]

// ── Inner app — has access to useLume() ───────────────────────────

interface InnerAppProps {
  page: Page
  setPage: (p: Page) => void
  team: typeof MOCK_TEAM_INITIAL
  notification: string | null
}

function InnerApp({ page, setPage, team, notification }: InnerAppProps) {
  const { setContext, open } = useLume()

  // sync context whenever page or team changes
  useEffect(() => {
    setContext({
      currentPage:  page,
      userPlan:     MOCK_USER.plan,
      userEmail:    MOCK_USER.email,
      teamSize:     team.length,
      nextBilling:  MOCK_USER.nextBilling,
      usagePercent: MOCK_USER.usage,
    })
  }, [page, team.length])

  return (
    <div style={{ fontFamily: 'system-ui', background: '#0f0f13', minHeight: '100vh', color: '#fff' }}>

      {/* Nav */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 24px', display: 'flex', alignItems: 'center', gap: 24, height: 52,
      }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: ACCENT }}>Acme</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {PAGES.map(p => (
            <button key={p} onClick={() => setPage(p)} style={{
              padding: '4px 12px', borderRadius: 6, border: 'none',
              background: page === p ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: page === p ? ACCENT : 'rgba(255,255,255,0.4)',
              fontSize: 13, cursor: 'pointer',
              fontWeight: page === p ? 500 : 400, textTransform: 'capitalize',
            }}>{p}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(99,102,241,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600, color: ACCENT,
          }}>AJ</div>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{MOCK_USER.email}</span>
        </div>
      </div>

      {/* Page content */}
      <div style={{ padding: '32px 24px', maxWidth: 860, margin: '0 auto' }}>

        {page === 'dashboard' && (
          <>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>Dashboard</h2>
            <p style={{ margin: '0 0 24px', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
              Welcome back, {MOCK_USER.name}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {[
                { label: 'Monthly visits', value: '24,821' },
                { label: 'Conversions',    value: '1,042' },
                { label: 'Team members',   value: team.length },
              ].map(card => (
                <div key={card.label} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12, padding: '16px 20px',
                }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>{card.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 600 }}>{card.value}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {page === 'analytics' && (
          <>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>Analytics</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Data updated every 15 minutes.</p>
            <div style={{
              marginTop: 16, background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: 24, height: 200,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.15)', fontSize: 13,
            }}>Chart placeholder</div>
          </>
        )}

        {page === 'billing' && (
          <>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>Billing</h2>
            <div style={{
              marginTop: 16, background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, padding: '16px 20px',
            }}>
              {[
                { label: 'Plan',         value: MOCK_USER.plan },
                { label: 'Status',       value: 'Active' },
                { label: 'Next billing', value: MOCK_USER.nextBilling },
                { label: 'Amount',       value: MOCK_USER.amount },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13,
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {page === 'team' && (
          <>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>Team</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {team.map(member => (
                <div key={member.email} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10, padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'rgba(99,102,241,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 600, color: ACCENT, flexShrink: 0,
                  }}>{member.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{member.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{member.email}</div>
                  </div>
                  <Pill color={member.role === 'admin' ? ACCENT : 'rgba(255,255,255,0.3)'}>{member.role}</Pill>
                  <Pill color={member.status === 'active' ? '#4ade80' : '#facc15'}>{member.status}</Pill>
                </div>
              ))}
            </div>
          </>
        )}

        {page === 'settings' && (
          <>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>Settings</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Manage your account, billing, and preferences.</p>
          </>
        )}

        {page === 'integrations' && (
          <>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>Integrations</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginTop: 16 }}>
              {['Slack', 'Notion', 'GitHub', 'Zapier'].map(name => (
                <div key={name} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10, padding: '14px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
                  <button style={{
                    fontSize: 12, padding: '4px 12px', borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                  }}>Connect</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Test prompts */}
        <div style={{
          marginTop: 40, background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: '16px 20px',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginBottom: 12, letterSpacing: '0.05em' }}>
            TEST PROMPTS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {TEST_PROMPTS.map(p => (
              <div
                key={p.text}
                onClick={() => open()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)', fontSize: 12,
                }}
              >
                <span style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 4, flexShrink: 0, fontWeight: 600,
                  background: p.label === 'Action'    ? 'rgba(99,102,241,0.15)' :
                              p.label === 'Component' ? 'rgba(20,184,166,0.15)' : 'rgba(234,179,8,0.1)',
                  color:      p.label === 'Action'    ? '#818cf8' :
                              p.label === 'Component' ? '#2dd4bf' : '#facc15',
                }}>{p.label}</span>
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      {notification && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(30,30,40,0.95)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, padding: '10px 18px', fontSize: 13,
          color: 'rgba(255,255,255,0.85)', zIndex: 9999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>{notification}</div>
      )}

      {/* Widget — zero config needed */}
      <AssistantWidget debug />
    </div>
  )
}

// ── Root app — owns state, provides Lume ──────────────────────────

export default function App() {
  const [page, setPage]               = useState<Page>('dashboard')
  const [team, setTeam]               = useState(MOCK_TEAM_INITIAL)
  const [notification, setNotification] = useState<string | null>(null)

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3000)
  }

  const actions = [
    defineAction(
      'redirectTo',
      {
        description: 'Navigate to a page in the app',
        examples: ['take me to billing', 'go to settings', 'open the dashboard', 'navigate to team', 'i want to see analytics'],
        parameters: {
          page: { type: 'string', required: true, description: 'dashboard, analytics, billing, settings, team, or integrations' },
        },
      },
      async ({ page }) => setPage(page as Page)
    ),
    defineAction(
      'inviteTeamMember',
      {
        description: 'Invite a new team member by email',
        examples: ['invite someone to my team', 'add a new team member', 'send an invite to alex@company.com', 'give sara access as admin'],
        parameters: {
          email: { type: 'string', required: true, description: 'Email address of the person to invite' },
          role:  { type: 'string', required: true, description: 'Role to assign: admin or viewer' },
        },
      },
      async ({ email, role }) => {
        const initials = (email as string).split('@')[0].slice(0, 2).toUpperCase()
        setTeam(prev => [
          ...prev,
          { name: (email as string).split('@')[0], email: email as string, role: role as string, avatar: initials, status: 'pending' },
        ])
        setPage('team')
        showNotification(`Invite sent to ${email}`)
      }
    ),
    defineAction(
      'removeTeamMember',
      {
        description: 'Remove a team member by their email address',
        examples: ['remove priya from the team', 'delete mike from my team', 'revoke access for mike@acme.co'],
        parameters: {
          email: { type: 'string', required: true, description: 'Email of the member to remove' },
        },
      },
      async ({ email }) => {
        setTeam(prev => prev.filter(m => m.email !== email))
        setPage('team')
        showNotification(`${email} has been removed`)
      }
    ),
    defineAction(
      'scheduleReport',
      {
        description: 'Schedule an analytics report to be emailed',
        examples: ['send me a weekly report', 'schedule a monthly analytics report', 'email me reports every week'],
        parameters: {
          frequency: { type: 'string', required: true, description: 'weekly or monthly' },
          email:     { type: 'string', required: true, description: 'Email to send the report to' },
        },
      },
      async ({ frequency, email }) => {
        showNotification(`${frequency} report scheduled → ${email}`)
      }
    ),
    defineAction(
      'exportData',
      {
        description: 'Export user data as CSV',
        examples: ['export my data', 'download my billing history', 'give me a data export'],
        parameters: {
          type: { type: 'string', required: true, description: 'analytics, billing, or team' },
        },
      },
      async ({ type }) => {
        showNotification(`Exporting ${type} data — you'll receive an email shortly`)
      }
    ),
  ]

  const components = [
    defineComponent(
      'billing_summary',
      {
        description: 'Show billing info when user asks about their plan, subscription, cost, or payment',
        examples: ['what is my billing status', 'how much do I owe', 'when does my card get charged', 'show me my invoice', 'what plan am I on'],
        props: {
          plan:        { type: 'string', required: true,  description: 'Current plan name e.g. Pro' },
          status:      { type: 'string', required: true,  description: 'active, cancelled, or past_due' },
          nextBilling: { type: 'string', required: false, description: 'Next billing date' },
          amount:      { type: 'string', required: false, description: 'Amount due e.g. $49.00' },
        },
      },
      (props) => {
        const status = String(props.status ?? '')
        const statusColor = status === 'active' ? '#4ade80' : status === 'past_due' ? '#f87171' : '#94a3b8'
        return (
          <Card>
            <Row label="Plan"   value={<span style={{ fontWeight: 500, color: ACCENT }}>{String(props.plan ?? '')}</span>} />
            <Row label="Status" value={<Pill color={statusColor}>{status}</Pill>} />
            {props.nextBilling && <Row label="Next billing" value={String(props.nextBilling)} />}
            {props.amount      && <Row label="Amount"       value={String(props.amount)} />}
          </Card>
        )
      }
    ),
    defineComponent(
      'user_profile',
      {
        description: 'Show the current user profile when asked about account details, who is logged in, or profile info',
        examples: ['show my profile', 'who am I logged in as', 'what is my account info', 'what email is on my account'],
        props: {
          name:        { type: 'string', required: true,  description: 'Full name' },
          email:       { type: 'string', required: true,  description: 'Email address' },
          plan:        { type: 'string', required: true,  description: 'Current plan' },
          memberSince: { type: 'string', required: false, description: 'Member since date' },
        },
      },
      (props) => {
        const name = String(props.name ?? '')
        const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
        return (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: `${ACCENT}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 600, color: ACCENT, flexShrink: 0,
              }}>{initials}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{String(props.email ?? '')}</div>
              </div>
            </div>
            <Row label="Plan" value={<span style={{ color: ACCENT, fontWeight: 500 }}>{String(props.plan ?? '')}</span>} />
            {props.memberSince && <Row label="Member since" value={String(props.memberSince)} />}
          </Card>
        )
      }
    ),
    defineComponent(
      'usage_bar',
      {
        description: 'Show usage or quota info when user asks how much of their plan they have used',
        examples: ['how much of my plan have I used', 'what is my remaining credit', 'am I close to my limit', 'show my usage', 'i want to know how much of my plan credit is still left'],
        props: {
          label: { type: 'string', required: true,  description: 'What is being measured e.g. API calls' },
          used:  { type: 'number', required: true,  description: 'Percentage used 0-100' },
          plan:  { type: 'string', required: false, description: 'Plan name for context' },
        },
      },
      (props) => {
        const used  = Math.min(100, Math.max(0, Number(props.used ?? 0)))
        const color = used > 90 ? '#f87171' : used > 70 ? '#facc15' : ACCENT
        return (
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{String(props.label ?? 'Usage')}</span>
              <span style={{ fontSize: 18, fontWeight: 600, color }}>{used}%</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 6, overflow: 'hidden' }}>
              <div style={{ width: `${used}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.4s ease' }} />
            </div>
            {props.plan && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
                {String(props.plan)} plan
              </div>
            )}
          </Card>
        )
      }
    ),
    defineComponent(
      'team_list',
      {
        description: 'Show team members when user asks who is on the team or about team members',
        examples: ['who is on my team', 'show me my team', 'list my team members', 'who has access to my account'],
        props: {
          members: { type: 'string', required: true, description: 'JSON array of {name, email, role} objects' },
        },
      },
      (props) => {
        let members: Array<{ name?: string; email?: string; role?: string }> = []
        try {
          const raw = props.members
          members = Array.isArray(raw) ? raw : typeof raw === 'string' ? JSON.parse(raw) : []
        } catch { members = [] }
        return (
          <Card>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
              {members.length} member{members.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.map((m, i) => {
                const name = m.name ?? m.email ?? 'Unknown'
                const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: `${ACCENT}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 600, color: ACCENT, flexShrink: 0,
                    }}>{initials}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{name}</div>
                      {m.email && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{m.email}</div>}
                    </div>
                    {m.role && <Pill color={m.role === 'admin' ? ACCENT : 'rgba(255,255,255,0.3)'}>{m.role}</Pill>}
                  </div>
                )
              })}
            </div>
          </Card>
        )
      }
    ),
  ]

  return (
    <LumeProvider
      model="qwen2.5"
      systemPrompt={`You are a support assistant embedded inside the Acme app.
You are already inside the app — never provide external links or URLs.
Always refer to pages by name.
The current user is ${MOCK_USER.name} on the ${MOCK_USER.plan} plan.`}
      knowledgeBase={knowledgeBase}
      actions={actions}
      components={components}
      accentColor="#6366f1"
      title="Acme Support"
    >
      <InnerApp
        page={page}
        setPage={setPage}
        team={team}
        notification={notification}
      />
    </LumeProvider>
  )
}