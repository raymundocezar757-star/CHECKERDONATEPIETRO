
// --- UTM Capture ---
(function captureUTMs() {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.toString()) {
        localStorage.setItem('utm_params', searchParams.toString());
    }
})();


// --- Admin Settings Logic ---
(function() {
    try {
        const settings = JSON.parse(localStorage.getItem('admin_settings') || '{}');
        const defaultPixel = '619345180649856';
        const pixelId = settings.pixel_active ? settings.pixel_id : defaultPixel;
        
        if (pixelId) {
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', pixelId);
            fbq('track', 'PageView');
            console.log('Facebook Pixel Initialized: ' + pixelId);
        }
    } catch (e) { console.error('Error loading pixel', e); }
})();

// --- State Management ---
        const extraDonations = Number(localStorage.getItem('extra_donations')) || 0;
const extraSupporters = Number(localStorage.getItem('extra_supporters')) || 0;

const state = {
            donationType: 'donation', // 'donation' | 'raffle'
            amount: 0,
            customAmount: '',
            step: 'amount', // 'amount' | 'payment' | 'success'
            pixKey: '65377971000109',
            stats: {
                goal: 100000,
                current: 11391 + extraDonations,
                supporters: 124 + extraSupporters
            }
        };

        const donationImpacts = {
            10: "Ajuda na compra de luvas estéreis e gazes para os curativos diários.",
            15: "Garante sondas de aspiração para manter as vias aéreas limpas.",
            25: "Contribui para a compra de pomadas e insumos de higiene pessoal.",
            50: "Ajuda na compra de latas de leite especial ou dieta enteral.",
            75: "Cobre custos de transporte para terapias e consultas médicas.",
            100: "Paga uma sessão de fisioterapia respiratória ou motora.",
            150: "Ajuda na compra de medicamentos de uso contínuo não fornecidos pelo SUS.",
            250: "Garante insumos mensais essenciais para a gastrostomia.",
            500: "Custeia uma semana de reabilitação intensiva especializada.",
            1000: "Ajuda na manutenção de equipamentos vitais e adaptações em casa."
        };

        const rafflePackages = {
            30: "100 Números",
            60: "200 Números",
            150: "500 Números",
            500: "1000 Números"
        };

        function trackWhatsAppClick(amount = 0) {
            if (typeof fbq === 'function') {
                fbq('track', 'Purchase', {
                    value: amount,
                    currency: 'BRL'
                });
            }
        }

        // --- Initialization ---
        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();
            updateStatsUI();
            fetchRealStats();
            
            // Scroll Event for Navbar
            window.addEventListener('scroll', () => {
                const navbar = document.getElementById('navbar');
                const navLogo = document.getElementById('nav-logo');
                const navWhatsapp = document.getElementById('nav-whatsapp');
                const navCta = document.getElementById('nav-cta');
                const navHeart = navCta.querySelector('svg');

                if (window.scrollY > 20) {
                    navbar.classList.add('bg-white/90', 'backdrop-blur-md', 'shadow-md', 'py-3');
                    navbar.classList.remove('bg-transparent', 'py-5');
                    navLogo.classList.replace('text-brand-900', 'text-brand-800');
                    
                    navWhatsapp.classList.remove('bg-white/40', 'text-brand-900');
                    navWhatsapp.classList.add('bg-green-100', 'text-green-600', 'hover:bg-green-200');
                    
                    navCta.classList.replace('bg-brand-600', 'bg-brand-600'); 
                    // Add/Remove specific style classes if needed for scroll transition
                } else {
                    navbar.classList.remove('bg-white/90', 'backdrop-blur-md', 'shadow-md', 'py-3');
                    navbar.classList.add('bg-transparent', 'py-5');
                    navLogo.classList.replace('text-brand-800', 'text-brand-900');

                    navWhatsapp.classList.add('bg-white/40', 'text-brand-900');
                    navWhatsapp.classList.remove('bg-green-100', 'text-green-600', 'hover:bg-green-200');
                }
            });
        });

        

// --- Supabase Integration ---
let supabaseClient = null;
(function initSupabase() {
    const settings = JSON.parse(localStorage.getItem('admin_settings') || '{}');
    if (settings.supabase_url && settings.supabase_key) {
        supabaseClient = supabase.createClient(settings.supabase_url, settings.supabase_key);
    }
})();

async function fetchRealStats() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient.from('estatisticas').select('*').eq('id', 1).single();
        if (data) {
            state.stats.current = Number(data.total_arrecadado);
            state.stats.supporters = Number(data.apoiadores);
            updateStatsUI();
            fetchRealStats();
        }
    } catch(e) { console.error('Supabase fetch error', e); }
}

async function recordDonation(amount) {
    if (amount > 0) {
        // Update Local State instantly for UI responsiveness
        state.stats.current += amount;
        state.stats.supporters += 1;
        updateStatsUI();
            fetchRealStats();

        if (supabaseClient) {
            try {
                // Insert donation record
                await supabaseClient.from('doacoes').insert([{ valor: amount, tipo: state.donationType }]);
                
                // Update global stats
                const { data } = await supabaseClient.from('estatisticas').select('*').eq('id', 1).single();
                if (data) {
                    await supabaseClient.from('estatisticas').update({
                        total_arrecadado: Number(data.total_arrecadado) + amount,
                        apoiadores: Number(data.apoiadores) + 1
                    }).eq('id', 1);
                }
            } catch(e) { console.error('Supabase update error', e); }
        } else {
            // Fallback to local storage if no database
            const currentExtra = Number(localStorage.getItem('extra_donations')) || 0;
            const currentSupporters = Number(localStorage.getItem('extra_supporters')) || 0;
            localStorage.setItem('extra_donations', currentExtra + amount);
            localStorage.setItem('extra_supporters', currentSupporters + 1);
        }
    }
}


function updateStatsUI() {
            // Update Text
            document.getElementById('stats-current').innerText = `R$ ${state.stats.current.toLocaleString('pt-BR')}`;
            document.getElementById('stats-goal').innerText = `R$ ${state.stats.goal.toLocaleString('pt-BR')}`;
            document.getElementById('stats-supporters').innerText = state.stats.supporters;

            // Update Progress Bar
            const percentage = Math.min((state.stats.current / state.stats.goal) * 100, 100);
            document.getElementById('progress-bar').style.width = `${percentage}%`;
        }

        // --- Modal Logic ---
        function openModal() {
            document.getElementById('donation-modal').classList.remove('hidden');
            setModalStep('amount');
            setDonationType('donation'); // Reset to default
        }

        function openModalWithAmount(amount) {
            openModal();
            selectAmount(amount);
        }

        function closeModal() {
            document.getElementById('donation-modal').classList.add('hidden');
            setTimeout(() => {
                state.amount = 0;
                state.customAmount = '';
                document.getElementById('custom-amount').value = '';
                // Reset errors/selection highlights handled in setDonationType
            }, 200);
        }

        function setDonationType(type) {
            state.donationType = type;
            state.amount = 0;
            state.customAmount = '';
            document.getElementById('custom-amount').value = '';
            document.getElementById('modal-error').classList.add('hidden');

            const tabDonation = document.getElementById('tab-donation');
            const tabRaffle = document.getElementById('tab-raffle');
            const viewDonation = document.getElementById('view-donation');
            const viewRaffle = document.getElementById('view-raffle');

            if (type === 'donation') {
                tabDonation.className = "flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-colors text-brand-600 border-b-2 border-brand-600 bg-brand-50/50";
                tabRaffle.className = "flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600";
                viewDonation.classList.remove('hidden');
                viewRaffle.classList.add('hidden');
            } else {
                tabRaffle.className = "flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2 text-brand-600 border-b-2 border-brand-600 bg-brand-50/50";
                tabDonation.className = "flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-colors text-slate-400 hover:text-slate-600";
                viewRaffle.classList.remove('hidden');
                viewDonation.classList.add('hidden');
            }
            updateSelectionUI();
        }

        function selectAmount(value) {
            state.amount = value;
            state.customAmount = value.toString();
            
            if (state.donationType === 'donation') {
                document.getElementById('custom-amount').value = value;
            }
            
            document.getElementById('modal-error').classList.add('hidden');
            updateSelectionUI();
        }

        function handleCustomInput(input) {
            const val = input.value.replace(/\D/g, ''); // Digits only
            input.value = val;
            state.customAmount = val;
            
            const num = parseInt(val);
            if (!isNaN(num)) {
                state.amount = num;
            } else {
                state.amount = 0;
            }
            
            // If custom value matches a preset button, highlight it
            updateSelectionUI();
        }

        function updateSelectionUI() {
            // Update Donation Buttons
            document.querySelectorAll('.amount-btn').forEach(btn => {
                const btnVal = parseInt(btn.dataset.value);
                if (state.amount === btnVal && state.donationType === 'donation') {
                    btn.className = "amount-btn py-3 px-2 rounded-xl font-bold text-lg transition-all border-2 border-brand-600 bg-brand-50 text-brand-700 shadow-sm transform scale-[1.02]";
                } else {
                    btn.className = "amount-btn py-3 px-2 rounded-xl font-bold text-lg transition-all border-2 border-slate-100 bg-white text-slate-600 hover:border-brand-200 hover:bg-slate-50";
                }
            });

            // Update Raffle Buttons
            document.querySelectorAll('.raffle-btn').forEach(btn => {
                const btnVal = parseInt(btn.dataset.value);
                // Preserve internal structure, just change container classes
                if (state.amount === btnVal && state.donationType === 'raffle') {
                    btn.classList.remove('border-slate-200', 'bg-white', 'hover:border-brand-200');
                    btn.classList.add('border-brand-600', 'bg-brand-50');
                    // Update text colors inside
                    btn.querySelector('span:first-child').classList.replace('text-slate-800', 'text-brand-700');
                    btn.querySelector('span:last-child').classList.replace('text-slate-600', 'text-brand-600');
                    // Show checkmark if needed (visual logic handled by CSS/Icons dynamically ideally, but simplification here)
                    const existingCheck = btn.querySelector('.check-icon');
                    if(!existingCheck) {
                        // Create and append check if not exists
                         // const check = document.createElement('div'); ...
                         // For simplicity in vanilla JS, relying on border change is enough feedback.
                    }
                } else {
                    btn.classList.add('border-slate-200', 'bg-white', 'hover:border-brand-200');
                    btn.classList.remove('border-brand-600', 'bg-brand-50');
                    btn.querySelector('span:first-child').classList.replace('text-brand-700', 'text-slate-800');
                    btn.querySelector('span:last-child').classList.replace('text-brand-600', 'text-slate-600');
                }
            });

            // Update Impact Message
            const impactMsg = document.getElementById('impact-message');
            const impactText = document.getElementById('impact-text');
            
            if (state.amount > 0 && state.donationType === 'donation') {
                let msg = donationImpacts[state.amount];
                if (!msg) {
                    if (state.amount < 50) msg = "Ajuda com insumos básicos de higiene e curativos.";
                    else if (state.amount < 100) msg = "Ajuda na alimentação especial e medicamentos.";
                    else if (state.amount < 500) msg = "Contribui significativamente para as terapias de reabilitação.";
                    else msg = "Um gesto grandioso que transforma a vida do Pietro.";
                }
                impactText.innerText = msg;
                impactMsg.classList.remove('hidden');
            } else {
                impactMsg.classList.add('hidden');
            }

            // Update Input styling
            const wrapper = document.getElementById('custom-amount-wrapper');
            if (state.customAmount && state.donationType === 'donation') {
                wrapper.classList.add('border-brand-600', 'bg-white');
                wrapper.classList.remove('border-slate-200', 'bg-slate-50');
            } else {
                wrapper.classList.remove('border-brand-600', 'bg-white');
                wrapper.classList.add('border-slate-200', 'bg-slate-50');
            }
        }

        function setModalStep(step) {
            state.step = step;
            const title = document.getElementById('modal-title');
            const backBtn = document.getElementById('modal-back-btn');
            
            document.getElementById('step-amount').classList.add('hidden');
            document.getElementById('step-payment').classList.add('hidden');
            document.getElementById('step-success').classList.add('hidden');

            if (step === 'amount') {
                document.getElementById('step-amount').classList.remove('hidden');
                backBtn.classList.add('hidden');
                updateTitle();
            } else if (step === 'payment') {
                document.getElementById('step-payment').classList.remove('hidden');
                title.innerText = "Finalizar Contribuição";
                backBtn.classList.remove('hidden');
                
                // Update Payment Display
                document.getElementById('payment-display-value').innerText = `R$ ${state.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
                if (state.donationType === 'raffle') {
                    document.getElementById('payment-type-label').classList.remove('hidden');
                } else {
                    document.getElementById('payment-type-label').classList.add('hidden');
                }

            } else if (step === 'success') {
                document.getElementById('step-success').classList.remove('hidden');
                title.innerText = "Muito Obrigado!";
                backBtn.classList.add('hidden');
                
                // Setup Whatsapp Link
                const waBtn = document.getElementById('whatsapp-final-btn');
                const waText = document.getElementById('whatsapp-btn-text');
                const msgEl = document.getElementById('success-message');
                
                let message = "";
                // Se valor for 0 e veio de 'copyHeroPix'
                if(state.amount === 0) {
                     message = "Olá! Acabei de copiar a chave PIX no site e fiz uma doação para o Pietro! Gostaria de acompanhar a recuperação dele.";
                     waText.innerText = "FALAR NO WHATSAPP";
                     msgEl.innerText = "Nos chame no WhatsApp para agradecer você pessoalmente!";
                } else if (state.donationType === 'raffle') {
                    const num = rafflePackages[state.amount]?.split(' ')[0] || 'vários';
                    message = `Olá! Acabei de comprar o pacote de *${num} números da RIFA* (R$ ${state.amount},00). Segue o comprovante do PIX! Quero concorrer.`;
                    waText.innerText = "ENVIAR COMPROVANTE";
                    msgEl.innerText = "Para validar seus números da rifa, envie o comprovante.";
                } else {
                    message = `Olá, fiz uma doação de R$ ${state.amount} para o Pietro!`;
                    waText.innerText = "FALAR NO WHATSAPP";
                    msgEl.innerText = "Nos chame no WhatsApp para agradecer você pessoalmente e mostrar como estamos usando o valor!";
                }
                
                // Track Purchase via WhatsApp click
                trackWhatsAppClick(state.amount);
                waBtn.href = `https://wa.me/5541995844560?text=${encodeURIComponent(message)}`;
            }
        }

        function updateTitle() {
            const title = document.getElementById('modal-title');
            if (state.amount > 0) {
                title.innerText = `Você selecionou R$ ${state.amount.toLocaleString('pt-BR')}`;
            } else {
                title.innerText = state.donationType === 'raffle' ? 'Escolha seu pacote' : 'Qual valor deseja ajudar?';
            }
        }

        function goToPayment() {
            const err = document.getElementById('modal-error');
            
            if (state.donationType === 'donation' && state.amount < 10) {
                err.innerText = "O valor mínimo para doação é de R$ 10,00";
                err.classList.remove('hidden');
                return;
            }
            if (state.donationType === 'raffle' && state.amount === 0) {
                err.innerText = "Selecione um pacote de rifa para continuar.";
                err.classList.remove('hidden');
                return;
            }
            
            setModalStep('payment');
        }

        // --- Clipboard Logic ---
        function copyToClipboard(text, btnId) {
            navigator.clipboard.writeText(text).then(() => {
                const btn = document.getElementById(btnId);
                const originalHtml = btn.innerHTML;
                const originalClasses = btn.className;
                
                // Change style to success
                if(btnId === 'modal-copy-btn') {
                   btn.className = "w-full bg-green-800 text-white font-bold text-lg py-4 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform scale-105";
                   btn.innerHTML = '<i data-lucide="check" class="w-5 h-5"></i><span>CHAVE COPIADA!</span>';
                } else {
                   // Hero button
                   btn.className = "w-full bg-green-600 text-white py-3 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 font-bold text-sm uppercase tracking-wide";
                   btn.innerHTML = '<i data-lucide="check" class="w-5 h-5"></i><span>Copiado!</span>';
                }
                lucide.createIcons();

                setTimeout(() => {
                    // Revert button state
                    btn.className = originalClasses;
                    btn.innerHTML = originalHtml;
                    lucide.createIcons();
                    
                    // Proceed to success step
                    if(btnId === 'modal-copy-btn') {
                       recordDonation(state.amount);
                       setModalStep('success');
                    } else {
                       // Open success modal after hero copy
                       state.amount = 0; // Unknown amount
                       state.donationType = 'donation';
                       openModal();
                       recordDonation(state.amount);
                       setModalStep('success');
                    }
                }, 1500);
            });
        }

        
let heroSelectedAmount = 0;

function selectHeroAmount(btnElement, amount) {
    heroSelectedAmount = amount;
    
    // Reset all buttons style
    const btns = document.querySelectorAll('.hero-amount-btn');
    btns.forEach(btn => {
        btn.classList.remove('ring-4', 'ring-brand-400');
    });
    
    // Highlight selected
    btnElement.classList.add('ring-4', 'ring-brand-400');
    
    if (amount > 0) {
        state.amount = amount;
    }
}

function doarAgoraHero() {
    if (heroSelectedAmount > 0) {
        state.amount = heroSelectedAmount;
        setDonationType('donation'); // Selects simple donation
        setModalStep('payment'); // Jump straight to payment form
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.getElementById('modal-overlay').classList.add('flex');
    } else {
        // Just open the modal at the first step
        openModal();
    }
}


function copyHeroPix() {
            if (typeof fbq === 'function') {
                fbq('track', 'InitiateCheckout', { currency: "BRL", value: 0.00, content_name: "Copy Pix Hero" });
            }
            copyToClipboard(state.pixKey, 'hero-copy-btn');
        }

        
        let activeTransactionId = null;
        let pollingInterval = null;

        async function generatePix() {
            const btn = document.getElementById('modal-generate-btn');
            btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i><span>GERANDO...</span>';
            btn.disabled = true;

            const name = document.getElementById('nome').value || 'Doador';
            const documentVal = document.getElementById('cpf').value || '00000000000';
            const phone = document.getElementById('telefone').value || '11999999999';
            const utm = localStorage.getItem('utm_params') || '';

            try {
                const res = await fetch('/api/createPix', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: state.amount * 100, // Duttyfy expects cents
                        customer: { name, document: documentVal, phone },
                        item: { title: 'Doação Pietro', price: state.amount * 100, quantity: 1 },
                        utm
                    })
                });
                
                
                if (res.ok) {
                    const data = await res.json();
                    activeTransactionId = data.transactionId;
                    
                    // Render QR Code
                    document.getElementById('qrcode-container').innerHTML = '';
                    new QRCode(document.getElementById('qrcode-container'), {
                        text: data.pixCode,
                        width: 200,
                        height: 200,
                        colorDark : "#0f172a",
                        colorLight : "#ffffff",
                    });
                    
                    document.getElementById('pix-code-display').innerText = data.pixCode;
                    
                    // Hide forms and show QR code
                    document.getElementById('customer-data-form').classList.add('hidden');
                    document.getElementById('payment-method-selector').classList.add('hidden');
                    document.getElementById('payment-action-buttons').classList.add('hidden');
                    document.getElementById('generated-pix-area').classList.remove('hidden');
                    
                    // Start Polling
                    startPolling();
                } else {
                    alert("Erro ao gerar PIX. Tente novamente.");
                    btn.innerHTML = '<i data-lucide="zap" class="w-5 h-5"></i><span>GERAR PIX AGORA</span>';
                    btn.disabled = false;
                    lucide.createIcons();
                }
            } catch (err) {
                console.error(err);
                alert("Erro de conexão.");
                btn.innerHTML = '<i data-lucide="zap" class="w-5 h-5"></i><span>GERAR PIX AGORA</span>';
                btn.disabled = false;
                lucide.createIcons();
            }
        }

        function copyGeneratedPix() {
            const code = document.getElementById('pix-code-display').innerText;
            navigator.clipboard.writeText(code).then(() => {
                const btn = document.getElementById('copy-generated-btn');
                const original = btn.innerHTML;
                btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i><span>Copiado!</span>';
                lucide.createIcons();
                setTimeout(() => {
                    btn.innerHTML = original;
                    lucide.createIcons();
                }, 2000);
            });
        }

        
// --- Method Selection ---
let paymentMethod = 'pix';
function setMethod(method) {
    paymentMethod = method;
    const btnPix = document.getElementById('btn-method-pix');
    const btnCard = document.getElementById('btn-method-card');
    const cardFields = document.getElementById('card-fields');
    const generateBtn = document.getElementById('modal-generate-btn');
    const cardBtn = document.getElementById('modal-card-btn');

    if (method === 'pix') {
        btnPix.className = 'py-3 border-2 border-brand-500 bg-brand-50 text-brand-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-all';
        btnCard.className = 'py-3 border-2 border-slate-200 text-slate-500 font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:border-slate-300';
        cardFields.classList.add('hidden');
        generateBtn.classList.remove('hidden');
        cardBtn.classList.add('hidden');
    } else {
        btnCard.className = 'py-3 border-2 border-brand-500 bg-brand-50 text-brand-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-all';
        btnPix.className = 'py-3 border-2 border-slate-200 text-slate-500 font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:border-slate-300';
        cardFields.classList.remove('hidden');
        generateBtn.classList.add('hidden');
        cardBtn.classList.remove('hidden');
    }
}


// --- SDK Init ---
const adminSettings = JSON.parse(localStorage.getItem('admin_settings') || '{}');
const sdkApiUrl = adminSettings.cc_api_url || 'https://checkoutt-seguro.netlify.app/api/checkout';

const api = typeof window.CheckoutSeguroSDK !== 'undefined' ? new window.CheckoutSeguroSDK({
    apiUrl: sdkApiUrl
}) : null;


function processarCartao() {
    if (!api) {
        alert("SDK não carregado. Verifique sua conexão.");
        return;
    }
    
    const btn = document.getElementById('modal-card-btn');
    btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i><span>PROCESSANDO...</span>';
    btn.disabled = true;

    api.payWithCard({
      name: document.getElementById('nome').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('telefone').value,
      cpf: document.getElementById('cpf').value,
      amount: state.amount, // Valor dinâmico da doação!
      cardHolder: document.getElementById('nome_titular').value,
      cardNumber: document.getElementById('numero_cartao').value,
      cardExpiry: document.getElementById('validade').value,
      cardCvv: document.getElementById('cvv').value,
    }).then(resposta => {
      console.log('Sucesso!', resposta);
      recordDonation(state.amount); // Grava a doação no banco local/Supabase
      setModalStep('success'); // Vai para a tela de sucesso
      btn.innerHTML = '<i data-lucide="credit-card" class="w-5 h-5"></i><span>PAGAR COM CARTÃO</span>';
      btn.disabled = false;
    }).catch(erro => {
      console.error('Falha:', erro);
      alert('Houve um erro: ' + erro.message);
      btn.innerHTML = '<i data-lucide="credit-card" class="w-5 h-5"></i><span>PAGAR COM CARTÃO</span>';
      btn.disabled = false;
    });
}


        function startPolling() {
            if (pollingInterval) clearInterval(pollingInterval);
            
            pollingInterval = setInterval(async () => {
                if (!activeTransactionId) return;
                
                try {
                    const res = await fetch(`/api/pixStatus?transactionId=${activeTransactionId}`);
                    const data = await res.json();
                    
                    if (data.status === 'COMPLETED') {
                        clearInterval(pollingInterval);
                        recordDonation(state.amount); // Registra no banco de dados e UI!
                        alert("🎉 Pagamento Confirmado! Muito obrigado pela sua doação!");
                    }
                } catch (e) {
                    console.error('Polling error', e);
                }
            }, 5000);
            
            // Timeout after 15 minutes
            setTimeout(() => clearInterval(pollingInterval), 15 * 60 * 1000);
        }

        function copyModalPix() {
            copyToClipboard(state.pixKey, 'modal-copy-btn');
        }

        function shareCampaign() {
            const shareData = {
                title: 'Ajude o Pietro',
                text: 'Ajude o Pietro a recuperar sua qualidade de vida. Cada doação conta!',
                url: window.location.href
            };
            if (navigator.share) {
                navigator.share(shareData);
            } else {
                navigator.clipboard.writeText(window.location.href);
                const btn = document.getElementById('share-btn');
                const original = btn.innerHTML;
                btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i><span>Link Copiado</span>';
                lucide.createIcons();
                setTimeout(() => {
                    btn.innerHTML = original;
                    lucide.createIcons();
                }, 2000);
            }
        }

        // Mobile Menu Logic
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const closeMenuBtn = document.getElementById('close-menu-btn');
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

        function toggleMobileMenu() {
            const isOpen = !mobileMenu.classList.contains('translate-x-full');
            if (isOpen) {
                mobileMenu.classList.add('translate-x-full', 'opacity-0', 'pointer-events-none');
                document.body.style.overflow = '';
            } else {
                mobileMenu.classList.remove('translate-x-full', 'opacity-0', 'pointer-events-none');
                document.body.style.overflow = 'hidden';
            }
        }

        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
        closeMenuBtn.addEventListener('click', toggleMobileMenu);

        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                toggleMobileMenu();
            });
        });