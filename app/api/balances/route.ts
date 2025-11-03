import db from "@/lib/db";
import { initDatabase } from "@/lib/init-db";

initDatabase();

// GET /api/balances?listId=123 — calculer les balances pour une liste
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const listId = searchParams.get("listId");

    if (!listId) {
      return new Response(
        JSON.stringify({ error: "listId requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Récupérer tous les membres de la liste
    const members = db
      .prepare(
        `SELECT u.id, u.first_name, u.last_name, u.photo
         FROM users u
         INNER JOIN list_members lm ON u.id = lm.user_id
         WHERE lm.list_id = ?`
      )
      .all(listId) as any[];

    // Initialiser les balances pour chaque membre
    const balances: Record<number, number> = {};
    members.forEach((member) => {
      balances[member.id] = 0;
    });

    // Récupérer toutes les dépenses non remboursées
    const expenses = db
      .prepare(
        `SELECT e.id, e.paid_by, e.amount
         FROM expenses e
         WHERE e.list_id = ? AND e.is_reimbursed = 0`
      )
      .all(listId) as any[];

    // Calculer les balances
    expenses.forEach((expense) => {
      // Celui qui a payé reçoit le montant total
      balances[expense.paid_by] += expense.amount;

      // Récupérer les splits pour cette dépense
      const splits = db
        .prepare(
          `SELECT user_id, amount FROM expense_splits WHERE expense_id = ?`
        )
        .all(expense.id) as any[];

      // Soustraire la part de chaque personne
      splits.forEach((split) => {
        balances[split.user_id] -= split.amount;
      });
    });

    // Formater les résultats avec les infos des utilisateurs
    const balanceResults = members.map((member) => ({
      userId: member.id,
      userName: `${member.first_name} ${member.last_name}`,
      photo: member.photo,
      balance: balances[member.id] || 0,
    }));

    // Calculer qui doit combien à qui (simplification des dettes)
    const settlements = calculateSettlements(balanceResults);

    return new Response(
      JSON.stringify({ balances: balanceResults, settlements }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Erreur inconnue";
    return new Response(
      JSON.stringify({
        error: "Erreur lors du calcul des balances",
        details: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Fonction pour simplifier les dettes (algorithme de règlement optimal)
function calculateSettlements(
  balances: Array<{ userId: number; userName: string; balance: number }>
) {
  const settlements: Array<{
    from: string;
    fromId: number;
    to: string;
    toId: number;
    amount: number;
  }> = [];

  // Séparer créditeurs et débiteurs
  // Clone objects to avoid mutating the original balances returned to the client
  const creditors = balances
    .filter((b) => b.balance > 0.01)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.balance - a.balance);
  const debtors = balances
    .filter((b) => b.balance < -0.01)
    .map((b) => ({ ...b }))
    .sort((a, b) => a.balance - b.balance);

  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

    if (amount > 0.01) {
      settlements.push({
        from: debtor.userName,
        fromId: debtor.userId,
        to: creditor.userName,
        toId: creditor.userId,
        amount: Math.round(amount * 100) / 100,
      });

      creditor.balance -= amount;
      debtor.balance += amount;
    }

    if (Math.abs(creditor.balance) < 0.01) i++;
    if (Math.abs(debtor.balance) < 0.01) j++;
  }

  return settlements;
}
