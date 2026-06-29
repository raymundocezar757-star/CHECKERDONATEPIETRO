// admin.js

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    loadSettings();
    loadRecoveryData();
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
        settings.cc_api_url = document.getElementById('cc-api-url').value;
        showToast('Configurações de Cartão salvas!');
    } else if (type === 'pix') {

        settings.pix_provider = document.getElementById('pix-provider').value;
        settings.pix_token = document.getElementById('pix-token').value;
        settings.pix_static_key = document.getElementById('pix-static-key').value;
        showToast('Configurações PIX salvas!');
    } else if (type === 'database') {
        settings.supabase_url = document.getElementById('supabase-url').value;
        settings.supabase_key = document.getElementById('supabase-key').value;
        showToast('Banco de Dados conectado!');
    } else if (type === 'pixel') {
        settings.pixel_id = document.getElementById('pixel-id').value;
        settings.pixel_token = document.getElementById('pixel-token').value;
        settings.pixel_active = document.getElementById('pixel-active').checked;
        showToast('Pixel configurado com sucesso!');
    }
    
    localStorage.setItem('admin_settings', JSON.stringify(settings));
}

function loadSettings() {
    let settings = JSON.parse(localStorage.getItem('admin_settings') || '{}');
    
    if (settings.cc_api_url) document.getElementById('cc-api-url').value = settings.cc_api_url;
    
    if (settings.supabase_url) document.getElementById('supabase-url').value = settings.supabase_url;
    if (settings.supabase_key) document.getElementById('supabase-key').value = settings.supabase_key;
    
    if (settings.pixel_id) document.getElementById('pixel-id').value = settings.pixel_id;
    if (settings.pixel_token) document.getElementById('pixel-token').value = settings.pixel_token;
    if (settings.pixel_active) document.getElementById('pixel-active').checked = settings.pixel_active;
}

async function loadRecoveryData() {
    const settings = JSON.parse(localStorage.getItem('admin_settings') || '{}');
    const tbody = document.getElementById('recovery-table');
    
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Carregando pedidos...</td></tr>';
    
    if (!settings.supabase_url || !settings.supabase_key) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-slate-500">Supabase não configurado. Adicione a chave na aba Banco de Dados.</td></tr>';
        return;
    }

    try {
        const supabaseClient = supabase.createClient(settings.supabase_url, settings.supabase_key);
        const { data: orders, error } = await supabaseClient.from('pedidos').select('*').order('created_at', { ascending: false }).limit(50);
        
        if (error) throw error;
        
        tbody.innerHTML = '';
        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-slate-500">Nenhum pedido encontrado.</td></tr>';
            return;
        }

        orders.forEach(order => {
            const tr = document.createElement('tr');
            
            let statusBadge = '';
            if (order.status === 'Pendente') {
                statusBadge = '<span class="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">PIX Pendente</span>';
            } else if (order.status === 'COMPLETED' || order.status === 'Pago') {
                statusBadge = '<span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Pago</span>';
            } else {
                statusBadge = '<span class="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">PIX Expirado</span>';
            }

            const amount = Number(order.valor) || 0;
            const msg = encodeURIComponent(`Olá ${order.nome || 'Amigo(a)'}, vimos que você tentou fazer uma doação de R$ ${amount.toFixed(2)} para ajudar o Pietro mas o pagamento ainda não foi concluído. Podemos te ajudar com algo?`);
            
            // Format phone to just numbers for whatsapp link
            let rawPhone = (order.telefone || '').replace(/\D/g, '');
            if (rawPhone && !rawPhone.startsWith('55') && rawPhone.length <= 11) {
                rawPhone = '55' + rawPhone;
            }
            const waLink = rawPhone ? `https://wa.me/${rawPhone}?text=${msg}` : '#';

            tr.innerHTML = `
                <td class="px-6 py-4 font-medium text-slate-800">${order.nome || '-'}</td>
                <td class="px-6 py-4">${order.telefone || '-'}</td>
                <td class="px-6 py-4 font-medium">R$ ${amount.toFixed(2)}</td>
                <td class="px-6 py-4">${statusBadge}</td>
                <td class="px-6 py-4 text-right">
                    <a href="${waLink}" target="_blank" class="inline-flex items-center gap-2 px-3 py-1.5 bg-[#25D366] text-white hover:bg-[#20b858] rounded-lg text-sm font-medium transition-colors ${!rawPhone ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}">
                        <i data-lucide="message-circle" class="w-4 h-4"></i> Recuperar
                    </a>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        lucide.createIcons();
    } catch(err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-red-500">Erro ao carregar banco (A tabela "pedidos" existe no Supabase?)</td></tr>';
    }
}
