import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import UploadStatement from './pages/UploadStatement';
import Reports from './pages/Reports';
import Content from './pages/Content';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Transactions": Transactions,
    "UploadStatement": UploadStatement,
    "Reports": Reports,
    "Content": Content,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};