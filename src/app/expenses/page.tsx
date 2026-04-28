import { AppShell } from "@/components/layout/AppShell";
import { ExpensesView } from "@/components/expenses/ExpensesView";

export default function ExpensesPage() {
  return (
    <AppShell>
      <ExpensesView />
    </AppShell>
  );
}
