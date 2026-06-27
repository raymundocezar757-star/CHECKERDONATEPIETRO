// admin.js

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    loadSettings();
    loadFakeRecoveryData();
});

function switchTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    // Remove active state from nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    document.getElementById('nav-' + tabId).classList.add('active');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    toastMessage.innerText = message;
    
    toast.classList.remove('translate-x-full');
    
    setTimeout(() => {
        toast.classList.add('translate-x-full');
    }, 3000);
}

function saveSettings(type) {
    let settings = JSON.parse(localStorage.getItem('admin_settings') || '{}');
    
    if (type === 'cc') {
        settings.cc_provider = document.getElementById('cc-provider').value;
        settings.cc_public_key = document.getElementById('cc-public-key').value;
        settings.cc_secret_key = document.getElementById('cc-secret-key').value;
        showToast('Configurações de Cartão salvas!');
    } else if (type === 'pix') {
        settings.pix_provider = document.getElementById('pix-provider').value;
        settings.pix_token = document.getElementById('pix-token').value;
        settings.pix_static_key = document.getElementById('pix-static-key').value;
        showToast('Configurações PIX salvas!');
    } else if (type === 'pixel') {
        settings.pixel_id = document.getElementById('pixel-id').value;
        settings.pixel_active = document.getElementById('pixel-active').checked;
        showToast('Pixel configurado com sucesso!');
    }
    
    localStorage.setItem('admin_settings', JSON.stringify(settings));
}

function loadSettings() {
    let settings = JSON.parse(localStorage.getItem('admin_settings') || '{}');
    
    if (settings.cc_provider) document.getElementById('cc-provider').value = settings.cc_provider;
    if (settings.cc_public_key) document.getElementById('cc-public-key').value = settings.cc_public_key;
    if (settings.cc_secret_key) document.getElementById('cc-secret-key').value = settings.cc_secret_key;
    
    if (settings.pix_provider) document.getElementById('pix-provider').value = settings.pix_provider;
    if (settings.pix_token) document.getElementById('pix-token').value = settings.pix_token;
    if (settings.pix_static_key) document.getElementById('pix-static-key').value = settings.pix_static_key;
    
    if (settings.pixel_id) document.getElementById('pixel-id').value = settings.pixel_id;
    if (settings.pixel_active) document.getElementById('pixel-active').checked = settings.pixel_active;
}

// Generate some fake data for the recovery tab
const fakeOrders = [
    { id: 1, name: 'João Silva', phone: '5511999999999', amount: 50.00, date: 'Hoje', status: 'Pendente' },
    { id: 2, name: 'Maria Oliveira', phone: '5511988888888', amount: 100.00, date: 'Ontem', status: 'Pendente' },
    { id: 3, name: 'Carlos Santos', phone: '5511977777777', amount: 25.00, date: '2 dias atrás', status: 'Expirado' }
];

function loadFakeRecoveryData() {
    const tbody = document.getElementById('recovery-table');
    tbody.innerHTML = '';
    
    fakeOrders.forEach(order => {
        const tr = document.createElement('tr');
        
        let statusBadge = '';
        if (order.status === 'Pendente') {
            statusBadge = '<span class="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">PIX Pendente</span>';
        } else {
            statusBadge = '<span class="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">PIX Expirado</span>';
        }

        const msg = encodeURIComponent(`Olá ${order.name}, vimos que você gerou um PIX de R$ ${order.amount.toFixed(2)} para ajudar o Pietro mas o pagamento ainda não foi concluído. Podemos te ajudar com algo? A chave PIX é: 65377971000109`);
        const waLink = `https://wa.me/${order.phone}?text=${msg}`;

        tr.innerHTML = `
            <td class="px-6 py-4 font-medium text-slate-800">${order.name}</td>
            <td class="px-6 py-4">${order.phone}</td>
            <td class="px-6 py-4 font-medium">R$ ${order.amount.toFixed(2)}</td>
            <td class="px-6 py-4">${statusBadge}</td>
            <td class="px-6 py-4 text-right">
                <a href="${waLink}" target="_blank" class="inline-flex items-center gap-2 px-3 py-1.5 bg-[#25D366] text-white hover:bg-[#20b858] rounded-lg text-sm font-medium transition-colors">
                    <i data-lucide="message-circle" class="w-4 h-4"></i> Recuperar
                </a>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    lucide.createIcons();
}
