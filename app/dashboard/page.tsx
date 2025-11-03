"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import Image from "next/image";

interface ExpenseList {
  id: number;
  name: string;
  created_at: string;
  members?: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  photo?: string;
}

interface Expense {
  id: number;
  description: string;
  amount: number;
  paid_by: number;
  payer_name: string;
  payer_photo?: string;
  date: string;
  is_reimbursed: number;
  splits: Array<{
    id: number;
    user_id: number;
    user_name: string;
    amount: number;
  }>;
}

interface Balance {
  userId: number;
  userName: string;
  photo?: string;
  balance: number;
}

interface Settlement {
  from: string;
  fromId: number;
  to: string;
  toId: number;
  amount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

  const [lists, setLists] = useState<ExpenseList[]>([]);
  const [selectedList, setSelectedList] = useState<ExpenseList | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [bulkReimbursing, setBulkReimbursing] = useState(false);

  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpenseDesc, setNewExpenseDesc] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [expensePaidBy, setExpensePaidBy] = useState<number | null>(null);
  const [expenseSplits, setExpenseSplits] = useState<Record<number, string>>({});

  const [filterMonth, setFilterMonth] = useState<string>("");

  // États pour les modales personnalisées
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmLabel?: string;
  } | null>(null);

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertModalData, setAlertModalData] = useState<{
    title: string;
    message: string;
    type: "error" | "success" | "info";
  } | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchLists();
      fetchAllUsers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedList && user) {
      fetchExpenses(selectedList.id);
      fetchBalances(selectedList.id);
    }
  }, [selectedList, user]);

  const fetchLists = async () => {
    try {
      const res = await fetch(`/api/lists?userId=${user?.id}`);
      const data = await res.json();
      setLists(data);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setAllUsers(data);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const fetchExpenses = async (listId: number) => {
    try {
      const res = await fetch(`/api/expenses?listId=${listId}`);
      const data = await res.json();
      setExpenses(data);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const fetchBalances = async (listId: number) => {
    try {
      const res = await fetch(`/api/balances?listId=${listId}`);
      const data = await res.json();
      setBalances(data.balances);
      setSettlements(data.settlements);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleCreateList = async () => {
    if (!newListName || newListName.trim() === "") {
      setAlertModalData({
        title: "Champ requis",
        message: "Veuillez renseigner un nom pour la liste",
        type: "error"
      });
      setShowAlertModal(true);
      return;
    }

    try {
      // Toujours inclure l'utilisateur actuel + les utilisateurs sélectionnés
      const userIdsWithMe = [...new Set([user!.id, ...selectedUserIds])];
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newListName,
          userIds: userIdsWithMe,
        }),
      });

      if (res.ok) {
        setNewListName("");
        setSelectedUserIds([]);
        setShowCreateList(false);
        fetchLists();
      } else {
        const error = await res.json();
        setAlertModalData({
          title: "Erreur",
          message: error.error || "Erreur lors de la création de la liste",
          type: "error"
        });
        setShowAlertModal(true);
      }
    } catch (error) {
      console.error("Erreur:", error);
      setAlertModalData({
        title: "Erreur",
        message: "Erreur lors de la création de la liste",
        type: "error"
      });
      setShowAlertModal(true);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpenseDesc || !newExpenseAmount || !expensePaidBy) {
      setAlertModalData({
        title: "Champs requis",
        message: "Veuillez remplir tous les champs obligatoires",
        type: "error"
      });
      setShowAlertModal(true);
      return;
    }

    const amount = parseFloat(newExpenseAmount);
    if (isNaN(amount) || amount <= 0) {
      setAlertModalData({
        title: "Montant invalide",
        message: "Veuillez entrer un montant valide supérieur à 0",
        type: "error"
      });
      setShowAlertModal(true);
      return;
    }

    const splits = Object.entries(expenseSplits)
      .map(([userId, amt]) => ({
        userId: parseInt(userId),
        amount: parseFloat(amt) || 0,
      }))
      .filter((s) => s.amount > 0);

    if (splits.length === 0) {
      setAlertModalData({
        title: "Répartition requise",
        message: "Veuillez répartir la dépense entre les membres",
        type: "error"
      });
      setShowAlertModal(true);
      return;
    }

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listId: selectedList!.id,
          description: newExpenseDesc,
          amount,
          paidBy: expensePaidBy,
          splits,
        }),
      });

      if (res.ok) {
        setNewExpenseDesc("");
        setNewExpenseAmount("");
        setExpensePaidBy(null);
        setExpenseSplits({});
        setShowAddExpense(false);
        fetchExpenses(selectedList!.id);
        fetchBalances(selectedList!.id);
      } else {
        setAlertModalData({
          title: "Erreur",
          message: "Erreur lors de l'ajout de la dépense",
          type: "error"
        });
        setShowAlertModal(true);
      }
    } catch (error) {
      console.error("Erreur:", error);
      setAlertModalData({
        title: "Erreur",
        message: "Erreur lors de l'ajout de la dépense",
        type: "error"
      });
      setShowAlertModal(true);
    }
  };

  const handleToggleReimbursed = async (expenseId: number, currentStatus: number) => {
    try {
      const res = await fetch("/api/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenseId,
          isReimbursed: currentStatus === 0 ? 1 : 0,
        }),
      });

      if (res.ok) {
        fetchExpenses(selectedList!.id);
        fetchBalances(selectedList!.id);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleDeleteExpense = async (expenseId: number, description: string) => {
    setConfirmModalData({
      title: "Supprimer la dépense",
      message: `Êtes-vous sûr de vouloir supprimer la dépense "${description}" ? Cette action est irréversible.`,
      confirmLabel: "Supprimer",
      onConfirm: async () => {
        try {
          await deleteExpenseConfirmed(expenseId);
        } catch (error) {
          console.error("Erreur:", error);
        }
      }
    });
    setShowConfirmModal(true);
  };

  const deleteExpenseConfirmed = async (expenseId: number) => {
    try {
      const res = await fetch(`/api/expenses?expenseId=${expenseId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchExpenses(selectedList!.id);
        fetchBalances(selectedList!.id);
      } else {
        const error = await res.json();
        setAlertModalData({
          title: "Erreur",
          message: error.error || "Erreur lors de la suppression",
          type: "error"
        });
        setShowAlertModal(true);
      }
    } catch (error) {
      console.error("Erreur:", error);
      setAlertModalData({
        title: "Erreur",
        message: "Erreur lors de la suppression de la dépense",
        type: "error"
      });
      setShowAlertModal(true);
    }
  };

  const handleReimburseAll = () => {
    if (!selectedList) return;
    setConfirmModalData({
      title: "Rembourser la totalité",
      message:
        "Êtes-vous sûr de vouloir marquer comme remboursées toutes les dépenses non remboursées de cette liste ?",
      onConfirm: async () => {
        setShowConfirmModal(false);
        setBulkReimbursing(true);
        try {
          const res = await fetch("/api/expenses", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listId: selectedList.id, reimburseAll: true }),
          });
          const data = await res.json();
          if (res.ok) {
            await fetchExpenses(selectedList.id);
            await fetchBalances(selectedList.id);
            setAlertModalData({
              title: "Terminé",
              message:
                (data.updated || 0) > 0
                  ? `${data.updated} dépense(s) marquée(s) comme remboursée(s).`
                  : "Aucune dépense à rembourser.",
              type: (data.updated || 0) > 0 ? "success" : "info",
            });
            setShowAlertModal(true);
          } else {
            setAlertModalData({
              title: "Erreur",
              message: data.error || "Échec du remboursement total",
              type: "error",
            });
            setShowAlertModal(true);
          }
        } catch (error) {
          console.error("Erreur:", error);
          setAlertModalData({
            title: "Erreur",
            message: "Une erreur est survenue lors du remboursement",
            type: "error",
          });
          setShowAlertModal(true);
        } finally {
          setBulkReimbursing(false);
        }
      },
    });
    setShowConfirmModal(true);
  };

  const filteredExpenses = filterMonth
    ? expenses.filter((e) => {
        const expenseDate = new Date(e.date);
        const month = expenseDate.getMonth() + 1;
        const year = expenseDate.getFullYear();
        return filterMonth === `${year}-${String(month).padStart(2, "0")}`;
      })
    : expenses;

  const hasPendingUnreimbursed = expenses.some((e) => e.is_reimbursed === 0);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen abstract-bg mesh-gradient relative overflow-hidden">
      {/* Particules flottantes décoratives */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-400/10 rounded-full particle blur-2xl" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-purple-400/10 rounded-full particle blur-2xl" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-pink-400/10 rounded-full particle blur-2xl" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-28 h-28 bg-indigo-400/10 rounded-full particle blur-2xl" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-20 right-16 w-36 h-36 bg-cyan-400/10 rounded-full particle blur-2xl" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-900/90 shadow-soft border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gradient dark:text-gradient-animated fade-in-up">
                Bonjour, {user.first_name} 👋
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérez vos finances facilement</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ThemeToggle />
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="flex-1 sm:flex-initial bg-gradient-danger text-white px-4 py-2 rounded-lg shadow-soft hover:shadow-medium transition-all ripple"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Déconnexion
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedList ? (
          /* Liste des listes */
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Mes listes de dépenses</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Organisez vos finances par groupe</p>
              </div>
              <button
                onClick={() => setShowCreateList(true)}
                className="w-full sm:w-auto bg-gradient-blue text-white px-5 py-2.5 rounded-lg shadow-medium hover:shadow-strong hover:neon-blue transition-all flex items-center justify-center gap-2 ripple shine-effect"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouvelle liste
              </button>
            </div>

            {lists.length === 0 ? (
              <div className="glass-card rounded-2xl shadow-medium p-12 text-center animate-scale-in zoom-in">
                <div className="inline-block p-4 bg-blue-50 dark:bg-blue-900/30 rounded-full mb-4 soft-pulse">
                  <svg className="w-12 h-12 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Aucune liste pour le moment</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Créez votre première liste pour commencer à gérer vos dépenses</p>
                <button
                  onClick={() => setShowCreateList(true)}
                  className="bg-gradient-blue text-white px-6 py-3 rounded-lg shadow-medium hover:shadow-strong transition-all ripple elastic-bounce"
                >
                  Créer ma première liste
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {lists.map((list, idx) => (
                  <div
                    key={list.id}
                    onClick={() => setSelectedList(list)}
                    className="glass-card rounded-xl shadow-soft p-6 cursor-pointer card-hover card-shine slide-up card-3d dynamic-shadow"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg">
                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">{list.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {list.members}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(list.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Modal Créer une liste */}
            {showCreateList && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 modal-overlay flex items-center justify-center z-50 p-4"
                onClick={() => {
                  setShowCreateList(false);
                  setNewListName("");
                  setSelectedUserIds([]);
                }}
              >
                <div
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-strong animate-scale-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-blue rounded-xl">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Nouvelle liste</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Créez une liste de dépenses partagée</p>
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Nom de la liste *
                    </label>
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="Ex: Vacances à Bali, Colocation..."
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                      autoFocus
                    />
                  </div>

                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Membres de la liste
                    </label>

                    {/* Utilisateur actuel (toujours inclus) */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 dark:text-gray-100">
                            {user?.first_name} {user?.last_name} (Vous)
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Administrateur</p>
                        </div>
                        <span className="badge bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs">
                          Inclus
                        </span>
                      </div>
                    </div>

                    {/* Autres utilisateurs */}
                    {allUsers.filter((u) => u.id !== user?.id).length > 0 ? (
                      <div className="max-h-60 overflow-y-auto space-y-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">Sélectionnez les autres membres (optionnel)</p>
                        {allUsers
                          .filter((u) => u.id !== user?.id)
                          .map((u) => (
                            <label
                              key={u.id}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                selectedUserIds.includes(u.id)
                                  ? 'bg-white dark:bg-gray-700 border-2 border-green-300 dark:border-green-600 shadow-sm'
                                  : 'bg-white dark:bg-gray-700 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedUserIds.includes(u.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUserIds([...selectedUserIds, u.id]);
                                  } else {
                                    setSelectedUserIds(selectedUserIds.filter((id) => id !== u.id));
                                  }
                                }}
                                className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-gray-800 dark:text-gray-200">
                                  {u.first_name} {u.last_name}
                                </p>
                              </div>
                              {selectedUserIds.includes(u.id) && (
                                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </label>
                          ))}
                      </div>
                    ) : (
                      <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 text-center">
                        <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">Aucun autre utilisateur disponible</p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Vous pouvez créer la liste seul ou inviter d'autres personnes à créer un compte</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleCreateList}
                      className="flex-1 bg-gradient-blue text-white py-3 rounded-xl font-semibold shadow-medium hover:shadow-strong transition-all flex items-center justify-center gap-2 ripple"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Créer la liste
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateList(false);
                        setNewListName("");
                        setSelectedUserIds([]);
                      }}
                      className="px-6 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all ripple"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Détails d'une liste */
          <div>
            <button
              onClick={() => {
                setSelectedList(null);
                setFilterMonth("");
              }}
              className="mb-6 flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors group underline-animated"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour aux listes
            </button>

            <div className="glass-card rounded-xl shadow-medium p-6 mb-6 slide-up zoom-in">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl glow-pulse rotate-3d" style={{ animationDuration: '20s' }}>
                  <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">{selectedList.name}</h2>
                  <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Membres: {selectedList.members}
                  </p>
                </div>
              </div>
            </div>

            {/* Balances */}
            <div className="glass-card rounded-xl shadow-medium p-6 mb-6 slide-up fade-in-up">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Résumé des comptes</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Vue d'ensemble des balances</p>
                  </div>
                </div>
                <button
                  onClick={handleReimburseAll}
                  disabled={bulkReimbursing || !hasPendingUnreimbursed}
                  className={`px-4 py-2 rounded-lg font-semibold shadow-soft transition-all ripple flex items-center gap-2 ${
                    bulkReimbursing || !hasPendingUnreimbursed
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      : "bg-gradient-success text-white hover:shadow-medium"
                  }`}
                  aria-label="Rembourser toutes les dépenses non remboursées"
               >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {bulkReimbursing ? "En cours..." : "Rembourser la totalité"}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {balances.map((balance, idx) => (
                  <div
                    key={balance.userId}
                    className={`p-5 rounded-xl shadow-soft animate-slide-in card-3d-reverse ${
                      balance.balance > 0
                        ? "bg-gradient-to-br from-emerald-100 to-green-200 dark:from-green-900/30 dark:to-emerald-900/30 border-l-4 border-emerald-700 dark:border-green-400"
                        : balance.balance < 0
                        ? "bg-gradient-to-br from-rose-100 to-red-200 dark:from-red-900/30 dark:to-rose-900/30 border-l-4 border-rose-700 dark:border-red-400"
                        : "bg-gradient-to-br from-slate-100 to-gray-200 dark:from-gray-800/30 dark:to-slate-800/30 border-l-4 border-slate-400 dark:border-gray-600"
                    }`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-gray-800 dark:text-gray-100">{balance.userName}</p>
                      {balance.balance > 0 ? (
                        <div className="p-1 bg-green-100 dark:bg-green-900/50 rounded-full">
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        </div>
                      ) : balance.balance < 0 ? (
                        <div className="p-1 bg-red-100 dark:bg-red-900/50 rounded-full">
                          <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </div>
                      ) : null}
                    </div>
                    <p className={`text-3xl font-bold mt-1 ${
                      balance.balance > 0
                        ? "text-emerald-800 dark:text-green-400"
                        : balance.balance < 0
                        ? "text-rose-800 dark:text-red-400"
                        : "text-slate-800 dark:text-gray-300"
                    }`}>
                      {balance.balance > 0 ? "+" : ""}
                      {balance.balance.toFixed(2)} €
                    </p>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-2">
                      {balance.balance > 0
                        ? "À recevoir"
                        : balance.balance < 0
                        ? "À payer"
                        : "À jour"}
                    </p>
                  </div>
                ))}
              </div>

              {settlements.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Règlements suggérés
                  </h4>
                  <div className="space-y-3">
                    {settlements.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-4 rounded-xl shadow-soft card-3d-reverse hover:shadow-medium transition-all">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm">
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-sm">
                            <span className="font-bold text-gray-800 dark:text-gray-100">{s.from}</span>
                            <span className="text-gray-600 dark:text-gray-400"> → </span>
                            <span className="font-bold text-gray-800 dark:text-gray-100">{s.to}</span>
                          </span>
                        </div>
                        <span className="font-bold text-blue-700 dark:text-blue-400 text-lg">{s.amount.toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dépenses */}
            <div className="glass-card rounded-xl shadow-medium p-6 slide-up">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Dépenses</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Historique des transactions</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm shadow-soft text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                  />
                  <button
                    onClick={() => setShowAddExpense(true)}
                    className="bg-gradient-success text-white px-4 py-2 rounded-lg shadow-medium hover:shadow-strong transition-all flex items-center gap-2 ripple"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Ajouter
                  </button>
                </div>
              </div>

              {filteredExpenses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-block p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-3 soft-pulse">
                    <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 fade-in-up">Aucune dépense pour le moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredExpenses.map((expense, idx) => (
                    <div
                      key={expense.id}
                      className={`border-2 rounded-xl p-5 shadow-soft slide-up card-3d ${
                        expense.is_reimbursed ? "glass-card border-gray-200 dark:border-gray-700 opacity-70" : "glass-card border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-strong dynamic-shadow"
                      }`}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1.5 rounded-lg ${expense.is_reimbursed ? 'bg-gray-200 dark:bg-gray-700' : 'bg-blue-100 dark:bg-blue-900/50'}`}>
                              <svg className={`w-4 h-4 ${expense.is_reimbursed ? 'text-gray-500 dark:text-gray-400' : 'text-blue-600 dark:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{expense.description}</p>
                            {expense.is_reimbursed === 1 && (
                              <span className="badge bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                                Remboursé
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Payé par <span className="font-semibold">{expense.payer_name}</span>
                            <span className="mx-1">•</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(expense.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                            <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Répartition:</p>
                            <div className="space-y-1">
                              {expense.splits.map((split) => (
                                <div key={split.id} className="flex justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">{split.user_name}</span>
                                  <span className="font-semibold text-gray-800 dark:text-gray-200">{split.amount.toFixed(2)} €</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4 flex flex-col items-end">
                          <div className={`inline-block px-4 py-2 rounded-xl ${expense.is_reimbursed ? 'bg-gray-100 dark:bg-gray-800' : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30'}`}>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Montant total</p>
                            <p className={`text-3xl font-bold ${expense.is_reimbursed ? 'text-gray-500 dark:text-gray-400' : 'text-blue-600 dark:text-blue-400'}`}>
                              {expense.amount.toFixed(2)} €
                            </p>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleToggleReimbursed(expense.id, expense.is_reimbursed)}
                              className={`text-sm px-4 py-2 rounded-lg font-semibold shadow-soft hover:shadow-medium transition-all ripple ${
                                expense.is_reimbursed
                                  ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                                  : "bg-gradient-success text-white"
                              }`}
                            >
                              {expense.is_reimbursed ? "Non remboursé" : "Remboursé"}
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense.id, expense.description)}
                              className="text-sm px-3 py-2 rounded-lg font-semibold bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/70 shadow-soft hover:shadow-medium transition-all ripple"
                              title="Supprimer cette dépense"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Ajouter une dépense */}
            {showAddExpense && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 modal-overlay flex items-center justify-center z-50 overflow-y-auto p-4"
                onClick={() => {
                  setShowAddExpense(false);
                  setNewExpenseDesc("");
                  setNewExpenseAmount("");
                  setExpensePaidBy(null);
                  setExpenseSplits({});
                }}
              >
                <div
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg my-8 shadow-strong animate-scale-in zoom-in premium-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-success rounded-xl">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Nouvelle dépense</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ajoutez une nouvelle transaction</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Description *
                      </label>
                      <input
                        type="text"
                        value={newExpenseDesc}
                        onChange={(e) => setNewExpenseDesc(e.target.value)}
                        placeholder="Ex: Restaurant, Courses, Essence..."
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-green-500 dark:focus:border-green-400 transition-colors text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Montant total *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newExpenseAmount}
                          onChange={(e) => setNewExpenseAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-4 py-3 pr-12 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-green-500 dark:focus:border-green-400 transition-colors text-lg font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-semibold">€</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Payé par *
                      </label>
                      <div className="relative">
                        <select
                          value={expensePaidBy || ""}
                          onChange={(e) => setExpensePaidBy(parseInt(e.target.value))}
                          className="w-full px-4 py-3 pr-10 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-green-500 dark:focus:border-green-400 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium appearance-none cursor-pointer hover:border-green-400 dark:hover:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/50 shadow-sm"
                        >
                          <option value="" disabled>Sélectionner une personne</option>
                          {allUsers
                            .filter((u) =>
                              selectedList.members?.includes(`${u.first_name} ${u.last_name}`)
                            )
                            .map((u) => (
                              <option key={u.id} value={u.id} className="py-2">
                                {u.first_name} {u.last_name} {u.id === user?.id ? "(Vous)" : ""}
                              </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Répartition entre les membres *
                      </label>
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 space-y-3 max-h-60 overflow-y-auto">
                        {allUsers
                          .filter((u) =>
                            selectedList.members?.includes(`${u.first_name} ${u.last_name}`)
                          )
                          .map((u) => (
                            <div key={u.id} className="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-600">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-green-100 dark:bg-green-900/50 rounded-full">
                                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                  {u.first_name} {u.last_name}
                                  {u.id === user?.id && <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(Vous)</span>}
                                </span>
                              </div>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={expenseSplits[u.id] || ""}
                                  onChange={(e) =>
                                    setExpenseSplits({ ...expenseSplits, [u.id]: e.target.value })
                                  }
                                  placeholder="0.00"
                                  className="w-28 px-3 py-2 pr-8 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-right font-semibold focus:border-green-500 dark:focus:border-green-400 transition-colors text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">€</span>
                              </div>
                            </div>
                          ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-1">
                        💡 Astuce: La somme des répartitions doit être égale au montant total
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleAddExpense}
                      className="flex-1 bg-gradient-success text-white py-3 rounded-xl font-semibold shadow-medium hover:shadow-strong transition-all flex items-center justify-center gap-2 ripple"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Ajouter la dépense
                    </button>
                    <button
                      onClick={() => {
                        setShowAddExpense(false);
                        setNewExpenseDesc("");
                        setNewExpenseAmount("");
                        setExpensePaidBy(null);
                        setExpenseSplits({});
                      }}
                      className="px-6 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de confirmation personnalisée */}
      {showConfirmModal && confirmModalData && (
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/70 modal-overlay flex items-center justify-center z-50 p-4"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-strong zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full flex-shrink-0">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{confirmModalData.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{confirmModalData.message}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  confirmModalData.onConfirm();
                  setShowConfirmModal(false);
                }}
                className="flex-1 bg-gradient-danger text-white py-3 rounded-xl font-semibold shadow-medium hover:shadow-strong transition-all ripple"
              >
                {confirmModalData.confirmLabel || "Confirmer"}
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all ripple"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'alerte personnalisée */}
      {showAlertModal && alertModalData && (
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/70 modal-overlay flex items-center justify-center z-50 p-4"
          onClick={() => setShowAlertModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-strong zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 rounded-full flex-shrink-0 ${
                alertModalData.type === "error"
                  ? "bg-red-100 dark:bg-red-900/50"
                  : alertModalData.type === "success"
                  ? "bg-green-100 dark:bg-green-900/50"
                  : "bg-blue-100 dark:bg-blue-900/50"
              }`}>
                {alertModalData.type === "error" ? (
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : alertModalData.type === "success" ? (
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{alertModalData.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{alertModalData.message}</p>
              </div>
            </div>
            <button
              onClick={() => setShowAlertModal(false)}
              className={`w-full py-3 rounded-xl font-semibold shadow-medium hover:shadow-strong transition-all ripple ${
                alertModalData.type === "error"
                  ? "bg-gradient-danger text-white"
                  : alertModalData.type === "success"
                  ? "bg-gradient-success text-white"
                  : "bg-gradient-blue text-white"
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
