import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import UploadStatement from './pages/UploadStatement';
import Reports from './pages/Reports';
import Content from './pages/Content';
import BankConnections from './pages/BankConnections';
import AIAssistant from './pages/AIAssistant';
import RecurringExpenses from './pages/RecurringExpenses';
import ManageBankAccounts from './pages/ManageBankAccounts';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Transactions": Transactions,
    "UploadStatement": UploadStatement,
    "Reports": Reports,
    "Content": Content,
    "BankConnections": BankConnections,
    "AIAssistant": AIAssistant,
    "RecurringExpenses": RecurringExpenses,
    "ManageBankAccounts": ManageBankAccounts,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};