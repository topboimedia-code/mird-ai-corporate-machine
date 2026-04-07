import { notFound } from "next/navigation";
import {
  Button,
  Input,
  Card,
  Badge,
  DataTable,
  Sparkline,
  ProgressBar,
  StepIndicator,
  StatusDot,
  Skeleton,
  EmptyState,
  AlertBanner,
} from "@rainmachine/ui";
import type { Step } from "@rainmachine/ui";

export default function UiDemoPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const sampleData = [
    { id: "1", name: "John Smith", stage: "new", score: "85" },
    { id: "2", name: "Jane Doe", stage: "contacted", score: "72" },
    { id: "3", name: "Bob Johnson", stage: "qualified", score: "91" },
  ];

  const columns = [
    { key: "name" as const, header: "Name" },
    { key: "stage" as const, header: "Stage" },
    { key: "score" as const, header: "Score" },
  ];

  const steps: Step[] = [
    { id: "1", label: "Account", status: "complete" },
    { id: "2", label: "Profile", status: "current" },
    { id: "3", label: "Launch", status: "upcoming" },
  ];

  return (
    <div
      data-testid="ui-demo-root"
      className="min-h-screen bg-background p-8 space-y-12"
    >
      <div>
        <h1 className="font-display text-cyan text-2xl uppercase tracking-widest mb-2">
          JARVIS Design System
        </h1>
        <p className="font-body text-text-muted text-sm">
          Component Library — All 16 Components
        </p>
      </div>

      {/* Button */}
      <section data-testid="section-button">
        <h2 className="font-display text-text text-xs uppercase tracking-widest mb-4">
          Button
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      {/* Input */}
      <section data-testid="section-input">
        <h2 className="font-display text-text text-xs uppercase tracking-widest mb-4">
          Input
        </h2>
        <div className="flex flex-col gap-4 max-w-sm">
          <Input label="Email" placeholder="you@example.com" />
          <Input label="With Error" error="This field is required" placeholder="..." />
          <Input
            label="With Hint"
            hint="We will never share your email"
            placeholder="..."
          />
        </div>
      </section>

      {/* Card */}
      <section data-testid="section-card">
        <h2 className="font-display text-text text-xs uppercase tracking-widest mb-4">
          Card
        </h2>
        <div className="grid grid-cols-3 gap-4 max-w-2xl">
          <Card variant="default">
            <p className="font-body text-text-muted text-sm">Default card</p>
          </Card>
          <Card variant="elevated">
            <p className="font-body text-text-muted text-sm">Elevated card</p>
          </Card>
          <Card variant="outlined">
            <p className="font-body text-text-muted text-sm">Outlined card</p>
          </Card>
        </div>
      </section>

      {/* Badge */}
      <section data-testid="section-badge">
        <h2 className="font-display text-text text-xs uppercase tracking-widest mb-4">
          Badge
        </h2>
        <div className="flex flex-wrap gap-2">
          <Badge color="cyan">Cyan</Badge>
          <Badge color="green">Green</Badge>
          <Badge color="orange">Orange</Badge>
          <Badge color="red">Red</Badge>
          <Badge color="gray">Gray</Badge>
          <Badge color="cyan" variant="outline">
            Outline
          </Badge>
        </div>
      </section>

      {/* DataTable */}
      <section data-testid="section-datatable">
        <h2 className="font-display text-text text-xs uppercase tracking-widest mb-4">
          DataTable
        </h2>
        <Card padding="none">
          <DataTable
            columns={columns}
            data={sampleData}
            data-testid="demo-table"
          />
        </Card>
        <div className="mt-4">
          <p className="font-body text-text-muted text-xs mb-2">Empty state:</p>
          <Card padding="none">
            <DataTable columns={columns} data={[]} emptyState="No leads yet" />
          </Card>
        </div>
        <div className="mt-4">
          <p className="font-body text-text-muted text-xs mb-2">Loading state:</p>
          <Card padding="none">
            <DataTable columns={columns} data={[]} loading />
          </Card>
        </div>
      </section>

      {/* Sparkline */}
      <section data-testid="section-sparkline">
        <h2 className="font-display text-text text-xs uppercase tracking-widest mb-4">
          Sparkline
        </h2>
        <div className="flex gap-6 items-end">
          <Sparkline
            data={[10, 25, 18, 40, 30, 55, 47]}
            color="cyan"
            data-testid="sparkline-cyan"
          />
          <Sparkline
            data={[5, 12, 8, 20, 15, 28, 22]}
            color="green"
            data-testid="sparkline-green"
          />
          <Sparkline
            data={[40, 35, 30, 38, 25, 20, 15]}
            color="orange"
            data-testid="sparkline-orange"
          />
          <Sparkline
            data={[50, 45, 40, 30, 25, 20, 10]}
            color="red"
            data-testid="sparkline-red"
          />
        </div>
      </section>

      {/* ProgressBar */}
      <section data-testid="section-progressbar">
        <h2 className="font-display text-text text-xs uppercase tracking-widest mb-4">
          ProgressBar
        </h2>
        <div className="flex flex-col gap-3 max-w-sm">
          <ProgressBar value={75} color="cyan" label="Leads" showValue />
          <ProgressBar value={45} color="green" label="Converted" showValue />
          <ProgressBar value={30} color="orange" label="At Risk" showValue />
          <ProgressBar value={10} color="red" label="Lost" showValue />
        </div>
      </section>

      {/* StepIndicator */}
      <section data-testid="section-stepindicator">
        <h2 className="font-display text-text text-xs uppercase tracking-widest mb-4">
          StepIndicator
        </h2>
        <StepIndicator
          steps={steps}
          orientation="horizontal"
          data-testid="demo-steps"
        />
      </section>

      {/* StatusDot */}
      <section data-testid="section-statusdot">
        <h2 className="font-display text-text text-xs uppercase tracking-widest mb-4">
          StatusDot
        </h2>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <StatusDot status="online" data-testid="dot-online" />
            <span className="font-body text-text-muted text-xs">Online</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot status="processing" data-testid="dot-processing" />
            <span className="font-body text-text-muted text-xs">Processing</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot status="at-risk" data-testid="dot-at-risk" />
            <span className="font-body text-text-muted text-xs">At Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot status="offline" data-testid="dot-offline" />
            <span className="font-body text-text-muted text-xs">Offline</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot status="standby" data-testid="dot-standby" />
            <span className="font-body text-text-muted text-xs">Standby</span>
          </div>
        </div>
      </section>

      {/* Skeleton */}
      <section data-testid="section-skeleton">
        <h2 className="font-display text-text text-xs uppercase tracking-widest mb-4">
          Skeleton
        </h2>
        <div className="flex flex-col gap-4 max-w-sm">
          <Skeleton variant="rect" height={80} />
          <Skeleton variant="text" lines={3} />
          <div className="flex gap-3">
            <Skeleton variant="circle" width={48} height={48} />
            <div className="flex-1">
              <Skeleton variant="text" lines={2} />
            </div>
          </div>
        </div>
      </section>

      {/* EmptyState */}
      <section data-testid="section-emptystate">
        <h2 className="font-display text-text text-xs uppercase tracking-widest mb-4">
          EmptyState
        </h2>
        <Card>
          <EmptyState
            title="No leads yet"
            description="Leads will appear here once your campaigns are live."
            action={
              <Button variant="secondary" size="sm">
                View Campaigns
              </Button>
            }
            data-testid="demo-empty-state"
          />
        </Card>
      </section>

      {/* AlertBanner */}
      <section data-testid="section-alertbanner">
        <h2 className="font-display text-text text-xs uppercase tracking-widest mb-4">
          AlertBanner
        </h2>
        <div className="flex flex-col gap-3 max-w-xl">
          <AlertBanner
            type="info"
            title="System Update"
            description="Maintenance scheduled for Sunday."
          />
          <AlertBanner
            type="warning"
            title="Low Balance"
            description="Your ad budget is running low."
          />
          <AlertBanner
            type="error"
            title="Sync Failed"
            description="GHL connection lost. Check settings."
          />
          <AlertBanner
            type="success"
            title="Campaign Live"
            description="Your Meta campaign is now running."
            dismissible
          />
        </div>
      </section>

      {/* Note: Modal, Toast, Tabs, Sidebar require client components */}
      <section data-testid="section-interactive-note">
        <p className="font-body text-text-dim text-xs">
          Modal, Toast, Tabs, and Sidebar are interactive client components.
          Test them in the app shell.
        </p>
      </section>
    </div>
  );
}
