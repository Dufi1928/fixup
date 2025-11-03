import db from "@/lib/db";
import { initDatabase } from "@/lib/init-db";

initDatabase();

// GET /api/expenses?listId=123 — récupérer toutes les dépenses d'une liste
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

    const expenses = db
      .prepare(
        `SELECT e.*,
         u.first_name || ' ' || u.last_name as payer_name,
         u.photo as payer_photo
         FROM expenses e
         LEFT JOIN users u ON e.paid_by = u.id
         WHERE e.list_id = ?
         ORDER BY e.date DESC`
      )
      .all(listId);

    // Pour chaque dépense, récupérer les splits (qui doit payer quoi)
    const expensesWithSplits = expenses.map((expense: any) => {
      const splits = db
        .prepare(
          `SELECT es.*, u.first_name || ' ' || u.last_name as user_name
           FROM expense_splits es
           LEFT JOIN users u ON es.user_id = u.id
           WHERE es.expense_id = ?`
        )
        .all(expense.id);

      return { ...expense, splits };
    });

    return new Response(JSON.stringify(expensesWithSplits), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Erreur inconnue";
    return new Response(
      JSON.stringify({ error: "Erreur lors de la récupération des dépenses", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST /api/expenses — créer une nouvelle dépense
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { listId, description, amount, paidBy, splits, date } = body ?? {};

    if (!listId || !description || !amount || !paidBy || !splits || !Array.isArray(splits)) {
      return new Response(
        JSON.stringify({ error: "Champs requis: listId, description, amount, paidBy, splits (array)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Créer la dépense
    const stmt = db.prepare(
      "INSERT INTO expenses (list_id, description, amount, paid_by, date) VALUES (?, ?, ?, ?, ?)"
    );
    const info = stmt.run(listId, description, amount, paidBy, date || new Date().toISOString());
    const expenseId = info.lastInsertRowid as number;

    // Ajouter les splits
    const addSplitStmt = db.prepare(
      "INSERT INTO expense_splits (expense_id, user_id, amount) VALUES (?, ?, ?)"
    );

    for (const split of splits) {
      if (!split.userId || split.amount === undefined) {
        continue;
      }
      addSplitStmt.run(expenseId, split.userId, split.amount);
    }

    const created = db
      .prepare(
        `SELECT e.*, u.first_name || ' ' || u.last_name as payer_name
         FROM expenses e
         LEFT JOIN users u ON e.paid_by = u.id
         WHERE e.id = ?`
      )
      .get(expenseId);

    return new Response(JSON.stringify(created), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Erreur inconnue";
    return new Response(
      JSON.stringify({ error: "Erreur lors de la création de la dépense", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// PATCH /api/expenses — marquer une dépense comme remboursée OU tout rembourser par liste
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { expenseId, isReimbursed, listId, reimburseAll } = body ?? {};

    // Mode 1: Rembourser toutes les dépenses d'une liste
    if (reimburseAll && listId) {
      const stmt = db.prepare(
        "UPDATE expenses SET is_reimbursed = 1 WHERE list_id = ? AND is_reimbursed = 0"
      );
      const result = stmt.run(listId);
      return new Response(
        JSON.stringify({ success: true, updated: result.changes || 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Mode 2: Mettre à jour une dépense individuelle
    if (!expenseId || isReimbursed === undefined) {
      return new Response(
        JSON.stringify({ error: "expenseId et isReimbursed requis (ou bien listId + reimburseAll)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const stmt = db.prepare(
      "UPDATE expenses SET is_reimbursed = ? WHERE id = ?"
    );
    stmt.run(isReimbursed ? 1 : 0, expenseId);

    const updated = db
      .prepare("SELECT * FROM expenses WHERE id = ?")
      .get(expenseId);

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Erreur inconnue";
    return new Response(
      JSON.stringify({ error: "Erreur lors de la mise à jour de la dépense", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE /api/expenses — supprimer une dépense
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const expenseId = searchParams.get("expenseId");

    if (!expenseId) {
      return new Response(
        JSON.stringify({ error: "expenseId requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Supprimer d'abord les splits (CASCADE devrait le faire automatiquement, mais on s'assure)
    db.prepare("DELETE FROM expense_splits WHERE expense_id = ?").run(expenseId);

    // Supprimer la dépense
    const stmt = db.prepare("DELETE FROM expenses WHERE id = ?");
    const result = stmt.run(expenseId);

    if (result.changes === 0) {
      return new Response(
        JSON.stringify({ error: "Dépense introuvable" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Dépense supprimée" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Erreur inconnue";
    return new Response(
      JSON.stringify({ error: "Erreur lors de la suppression de la dépense", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
