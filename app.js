(() => {
  'use strict';

  const STORAGE_KEY = 'bottle_quiz_prototype_v1';
  const FUNNEL_VERSION = 'prototype_pt_12screens_v1';
  const app = document.querySelector('#app');

  const options = (items) => items.map(([value,label,icon]) => ({value,label,icon}));

  const screens = [
    {
      id:'babyAge', type:'single', eyebrow:'PERFIL DO BEBÊ',
      title:'Quantos meses seu bebê tem?',
      subtitle:'Isso ajuda a colocar as respostas no contexto certo.',
      options: options([
        ['0-2','0–2 meses','🌱'],['3-4','3–4 meses','🌿'],['5-6','5–6 meses','🍃'],['7-10','7–10 meses','🧸'],['10+','Mais de 10 meses','✨']
      ])
    },
    {
      id:'returnTimeline', type:'single', eyebrow:'SEU PRAZO',
      title:'Em quanto tempo você volta ao trabalho ou precisará ficar regularmente longe do seu bebê?',
      subtitle:'Esse prazo será usado no seu resultado.',
      options: options([
        ['3d','Nos próximos 3 dias','⏳'],['7d','Em 4–7 dias','📅'],['14d','Em 1–2 semanas','🗓️'],['30d','Em 3–4 semanas','📆'],['30plus','Mais de um mês','🌤️']
      ])
    },
    {
      id:'history', type:'single', eyebrow:'HISTÓRICO',
      title:'Seu bebê já conseguiu tomar mamadeira antes?',
      options: options([
        ['never','Nunca aceitou de verdade','🚫'],['few','Aceitou algumas vezes, mas nunca foi consistente','↔️'],['stopped','Aceitava normalmente e depois parou','⏸️'],['sometimes','Ainda aceita às vezes, mas é imprevisível','🔄']
      ])
    },
    {
      id:'behavior', type:'single', eyebrow:'PADRÃO DA RECUSA',
      title:'O que geralmente acontece quando vocês tentam oferecer a mamadeira?',
      subtitle:'Escolha o que acontece na maioria das tentativas.',
      options: options([
        ['strong','Chora ou vira o rosto antes mesmo de tentar','😣'],['noSuck','Coloca o bico na boca, mas não começa a sugar','🍼'],['chews','Mastiga ou brinca com o bico','👶'],['stops','Começa a sugar, mas para rapidamente','⏱️'],['tiny','Toma apenas uma pequena quantidade','💧'],['variable','Aceita em algumas situações e recusa em outras','🔀']
      ])
    },
    {
      id:'bottleCount', type:'single', eyebrow:'O QUE VOCÊ JÁ TENTOU',
      title:'Quantos tipos diferentes de mamadeira ou bico você já tentou?',
      options: options([
        ['1','1','1️⃣'],['2-3','2–3','2️⃣'],['4-5','4–5','4️⃣'],['6+','6 ou mais','6️⃣']
      ])
    },
    { id:'insight', type:'insight' },
    {
      id:'tried', type:'multi', eyebrow:'SUAS TENTATIVAS', max:8,
      title:'O que você já tentou mudar?',
      subtitle:'Marque tudo que se aplica.',
      options: options([
        ['bottle','Mamadeira','🍼'],['nipple','Tipo de bico','◉'],['flow','Fluxo do bico','💧'],['temp','Temperatura do leite','🌡️'],['position','Posição durante a alimentação','🤱'],['caregiver','Outra pessoa oferecendo','👥'],['timing','Horário ou momento da tentativa','🕒'],['milk','Leite fresco ou armazenado','🥛'],['few','Ainda tentei poucas coisas','🌱']
      ])
    },
    {
      id:'caregiver', type:'single', eyebrow:'CONTEXTO',
      title:'Com quem seu bebê chega mais perto de aceitar a mamadeira?',
      options: options([
        ['mom','Comigo','🤱'],['partner','Com meu parceiro(a)','👤'],['other','Com outro cuidador ou familiar','👵'],['depends','Depende do momento','🔄'],['nobody','Com ninguém','🚫']
      ])
    },
    {
      id:'fear', type:'single', eyebrow:'O QUE MAIS PESA AGORA',
      title:'O que mais preocupa você neste momento?',
      options: options([
        ['nobodyFeed','Ninguém conseguir alimentar meu bebê quando eu estiver fora','🍼'],['work','Ter que voltar ao trabalho sem resolver isso','💼'],['daycare','Meu bebê não beber o suficiente na daycare','🏡'],['call','Receber uma ligação e precisar abandonar o trabalho','📞'],['freedom','Não conseguir ficar longe do meu bebê','🔒'],['worse','Piorar ainda mais a recusa tentando coisas erradas','⚠️']
      ])
    },
    {
      id:'safety', type:'multi', safety:true, eyebrow:'CHECAGEM DE SEGURANÇA',
      title:'Alguma destas situações está acontecendo com seu bebê?',
      subtitle:'Marque tudo que se aplica. Esta etapa não faz diagnóstico; ela só ajuda a saber quando o DIY deve parar.',
      options: options([
        ['weight','Um profissional demonstrou preocupação com ganho de peso ou crescimento','⚖️'],['hydration','Sinais de possível desidratação ou redução importante das fraldas molhadas','💧'],['cough','Tosse ou engasgos frequentes durante as mamadas','⚠️'],['breathing','Alterações importantes na respiração durante a alimentação','🫁'],['pain','Sinais claros de dor durante a alimentação','😣'],['vomit','Vômitos importantes ou frequentes','↩️'],['lethargy','Muito sonolento, difícil de despertar ou sem energia','💤'],['professional','Algum profissional já levantou preocupação com alimentação ou deglutição','🩺'],['none','Nenhuma dessas situações','✓']
      ])
    },
    { id:'analysis', type:'analysis' },
    { id:'result', type:'result' }
  ];

  const defaultState = { current:0, answers:{}, startedAt:Date.now(), events:[] };
  let state = loadState();

  function loadState(){
    try{
      const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
      if(parsed && Number.isInteger(parsed.current) && parsed.answers) return parsed;
    }catch{}
    return structuredClone(defaultState);
  }
  function persist(){
    try{ sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch{}
  }
  function reset(){
    state = structuredClone(defaultState); state.startedAt = Date.now(); persist(); render(); window.scrollTo({top:0,behavior:'smooth'});
  }
  function track(name, data={}){
    const event = {name, at:new Date().toISOString(), funnel_version:FUNNEL_VERSION, ...data};
    state.events = [...(state.events||[]), event].slice(-100);
    persist();
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(event);
    console.info('[prototype event]', event);
  }

  function currentScreen(){ return screens[state.current] || screens[0]; }
  function realQuestionIndex(index=state.current){
    return screens.slice(0,index+1).filter(x=>['single','multi'].includes(x.type)).length;
  }
  function totalQuestions(){ return screens.filter(x=>['single','multi'].includes(x.type)).length; }
  function progressPct(){
    if(currentScreen().type==='result') return 100;
    const q = realQuestionIndex();
    return Math.max(4, Math.min(96, (q/totalQuestions())*100));
  }

  function brand(){
    return `<div class="brand"><div class="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M9 3h6v3l2 2v9.5A3.5 3.5 0 0 1 13.5 21h-3A3.5 3.5 0 0 1 7 17.5V8l2-2V3Z" stroke="currentColor" stroke-width="1.8"/><path d="M9 11h6M9 14h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></div><div class="brand-copy"><strong>Método Mamadeira em 3 Dias</strong><span>protótipo do assessment</span></div></div>`;
  }

  function shell(content, {hideBack=false}={}){
    const q = realQuestionIndex();
    return `<div class="quiz-shell"><div class="quiz-top"><button class="back" id="back" ${hideBack||state.current===0?'disabled':''} aria-label="Voltar">←</button>${brand()}<div class="progress-row"><div class="progress"><span style="width:${progressPct()}%"></span></div><div class="progress-text">${Math.min(q,totalQuestions())}/${totalQuestions()}</div></div></div>${content}<p class="micro">Protótipo estratégico. A versão final será adaptada para inglês americano e revisada antes do tráfego.</p></div>`;
  }

  function renderQuestion(s){
    const selected = state.answers[s.id];
    const multiSelected = Array.isArray(selected) ? selected : [];
    const answers = s.options.map(o=>{
      const isSelected = s.type==='multi' ? multiSelected.includes(o.value) : selected===o.value;
      return `<button class="answer ${isSelected?'selected':''}" data-option="${esc(o.value)}" aria-pressed="${isSelected}"><span class="answer-icon">${o.icon||'•'}</span><span class="answer-label">${esc(o.label)}</span><span class="answer-check">✓</span></button>`;
    }).join('');
    const continueBtn = s.type==='multi' ? `<button class="primary" id="continue" ${multiSelected.length?'':'disabled'}>Continuar</button>` : '';
    return shell(`<section class="card"><div class="eyebrow"><span class="eyebrow-dot"></span>${esc(s.eyebrow||'RÁPIDO E PERSONALIZADO')}</div><h1>${esc(s.title)}</h1>${s.subtitle?`<p class="lead">${esc(s.subtitle)}</p>`:''}<div class="answers">${answers}</div>${continueBtn}${s.safety?'<p class="question-note">Se houver uma preocupação urgente com alimentação, hidratação ou respiração, procure atendimento profissional apropriado.</p>':''}</section>`);
  }

  function renderInsight(){
    const bottleLabel = labelFor('bottleCount', state.answers.bottleCount) || 'algumas';
    const history = historyPhrase();
    return shell(`<section class="card insight-card"><div class="insight-icon">🧭</div><div class="eyebrow"><span class="eyebrow-dot"></span>PRIMEIRO INSIGHT</div><h2>Você não parece estar com falta de tentativa.</h2><p class="lead">Até aqui, você contou que ${esc(history.toLowerCase())} e já testou <strong>${esc(bottleLabel)}</strong> combinação(ões) de mamadeira ou bico.</p><ul class="insight-list"><li><b>1.</b><span>O próximo passo não precisa ser comprar outra mamadeira.</span></li><li><b>2.</b><span>Primeiro vamos organizar <strong>como</strong> a recusa acontece.</span></li><li><b>3.</b><span>Depois disso, o protocolo de 3 dias fica muito mais específico para o seu cenário.</span></li></ul><button class="primary" id="continue">Continuar minha análise</button></section>`);
  }

  function renderAnalysis(){
    return shell(`<section class="card loading-wrap"><div class="loader-ring"></div><div class="eyebrow"><span class="eyebrow-dot"></span>ANALISANDO SUAS RESPOSTAS</div><h2>Montando seu protocolo...</h2><p class="lead">Estamos cruzando o histórico, o padrão da recusa, o que você já tentou e quanto tempo falta para a sua separação.</p><div class="loading-status"><div class="status-row"><span>✓</span>Revisando histórico de mamadeira</div><div class="status-row"><span>✓</span>Comparando tentativas anteriores</div><div class="status-row"><span>✓</span>Identificando o padrão dominante</div><div class="status-row"><span>✓</span>Preparando a rota de 3 dias</div></div></section>`,{hideBack:true});
  }

  function hasSafetyFlags(){
    const flags = state.answers.safety || [];
    return flags.length>0 && !flags.includes('none');
  }

  function deriveProfile(){
    const h=state.answers.history, b=state.answers.behavior;
    if(h==='stopped') return {name:'Aceitava e Parou', desc:'Seu bebê já teve experiência bem-sucedida com a mamadeira, mas agora a resposta mudou.'};
    if(h==='never') return {name:'Nunca Engrenou', desc:'A aceitação da mamadeira ainda não se tornou consistente.'};
    if(b==='strong') return {name:'Recusa Forte', desc:'As tentativas costumam gerar choro, afastamento ou resistência antes de uma mamada consistente.'};
    if(['noSuck','chews','stops','tiny'].includes(b)) return {name:'Pega, mas Não Sustenta', desc:'Seu bebê interage com a mamadeira, mas a tentativa não se transforma em uma mamada consistente.'};
    return {name:'Aceitação Instável', desc:'A resposta à mamadeira muda de acordo com o momento ou contexto.'};
  }

  function modifiers(){
    const list=[];
    if(['4-5','6+'].includes(state.answers.bottleCount)) list.push('muitas tentativas anteriores');
    if(state.answers.caregiver==='nobody') list.push('nenhum cuidador consegue avançar bem');
    if(['3d','7d'].includes(state.answers.returnTimeline)) list.push('prazo curto para a separação');
    if(state.answers.behavior==='strong') list.push('resposta emocional intensa nas tentativas');
    if(state.answers.history==='sometimes'||state.answers.behavior==='variable') list.push('forte variação de contexto');
    return list;
  }

  function timelinePhrase(){
    return ({'3d':'nos próximos 3 dias','7d':'em 4–7 dias','14d':'em 1–2 semanas','30d':'em 3–4 semanas','30plus':'em mais de um mês'})[state.answers.returnTimeline] || 'em breve';
  }
  function historyPhrase(){
    return ({never:'Seu bebê nunca aceitou a mamadeira de forma consistente',few:'Seu bebê aceitou algumas vezes, mas nunca de forma consistente',stopped:'Seu bebê aceitava a mamadeira e depois parou',sometimes:'Seu bebê ainda aceita às vezes, mas é imprevisível'})[state.answers.history] || 'Existe um padrão de recusa que ainda precisa ser organizado';
  }
  function behaviorPhrase(){
    return ({strong:'Chora ou vira o rosto antes mesmo de tentar',noSuck:'Coloca o bico na boca, mas não começa a sugar',chews:'Mastiga ou brinca com o bico',stops:'Começa a sugar, mas para rapidamente',tiny:'Toma apenas uma pequena quantidade',variable:'Aceita em algumas situações e recusa em outras'})[state.answers.behavior] || 'Resposta variável à mamadeira';
  }
  function fearPhrase(){
    return ({nobodyFeed:'Ninguém conseguir alimentar seu bebê quando você estiver fora',work:'Voltar ao trabalho sem resolver isso',daycare:'Seu bebê não beber o suficiente na daycare',call:'Receber uma ligação e precisar abandonar o trabalho',freedom:'Não conseguir ficar longe do seu bebê',worse:'Piorar a recusa tentando coisas erradas'})[state.answers.fear] || 'Resolver a recusa antes da separação';
  }
  function triedPhrase(){
    const arr=state.answers.tried||[];
    if(!arr.length) return 'Poucas variáveis registradas';
    const map={bottle:'mamadeira',nipple:'tipo de bico',flow:'fluxo',temp:'temperatura do leite',position:'posição',caregiver:'quem oferece',timing:'horário/momento',milk:'leite fresco ou armazenado',few:'poucas mudanças até agora'};
    const labels=arr.map(x=>map[x]).filter(Boolean);
    return labels.slice(0,4).join(', ') + (labels.length>4?` + ${labels.length-4} outras`:'');
  }
  function labelFor(id,value){
    const s=screens.find(x=>x.id===id); return s?.options?.find(x=>x.value===value)?.label || '';
  }

  function renderSafetyResult(){
    const profile=deriveProfile();
    app.innerHTML=`<main class="result-shell">${brand()}<section class="result-hero safety"><span class="result-badge">CHECAGEM DE SEGURANÇA</span><h1>Antes do protocolo de 3 dias, existe uma etapa mais importante.</h1><p class="lead">Você marcou pelo menos um sinal que merece avaliação profissional apropriada antes de continuar tentando resolver isso por conta própria.</p><div class="profile-card"><div class="profile-label">Seu padrão educacional até aqui</div><div class="profile-name">${esc(profile.name)}</div><p class="lead">${esc(profile.desc)}</p></div><button class="primary" id="restart">Refazer o assessment</button></section><section class="section"><h2>O que fazer com este resultado</h2><p>Use as respostas como um resumo organizado do que está acontecendo e converse com o pediatra e/ou profissional qualificado em alimentação infantil. Este protótipo não diagnostica nem substitui avaliação clínica.</p></section><p class="footer-note">Sinais de dificuldade respiratória, desidratação importante, letargia ou outra preocupação urgente exigem assistência adequada, não um produto digital.</p></main>`;
    document.querySelector('#restart')?.addEventListener('click',reset);
    track('SafetyResultViewed');
  }

  function renderResult(){
    if(hasSafetyFlags()) return renderSafetyResult();
    const profile=deriveProfile(), mods=modifiers();
    const bottleCount=labelFor('bottleCount',state.answers.bottleCount)||'—';
    const modifierText=mods.length?mods.join(' • '):'sem modificadores fortes identificados';
    app.innerHTML=`<main class="result-shell">${brand()}
      <section class="result-hero"><span class="result-badge">SEU RESULTADO ESTÁ PRONTO</span><h1>Seu Protocolo Mamadeira em 3 Dias foi identificado.</h1><p class="lead">Você pretende se afastar do bebê <strong>${esc(timelinePhrase())}</strong>. A partir das respostas, montamos uma rota inicial focada no padrão que apareceu com mais força.</p><div class="profile-card"><div class="profile-label">Perfil principal</div><div class="profile-name">${esc(profile.name)}</div><p class="lead">${esc(profile.desc)}</p><p class="question-note"><strong>Modificadores:</strong> ${esc(modifierText)}</p></div>
      <div class="summary-grid"><div class="summary-item"><div class="summary-icon">⏳</div><div><small>Seu prazo</small><strong>${esc(timelinePhrase())}</strong></div></div><div class="summary-item"><div class="summary-icon">🍼</div><div><small>Histórico</small><strong>${esc(historyPhrase())}</strong></div></div><div class="summary-item"><div class="summary-icon">🔍</div><div><small>Na maioria das tentativas</small><strong>${esc(behaviorPhrase())}</strong></div></div><div class="summary-item"><div class="summary-icon">💸</div><div><small>Mamadeiras/bicos testados</small><strong>${esc(bottleCount)}</strong></div></div><div class="summary-item"><div class="summary-icon">🧪</div><div><small>Variáveis já mexidas</small><strong>${esc(triedPhrase())}</strong></div></div><div class="summary-item"><div class="summary-icon">❤️</div><div><small>Maior preocupação</small><strong>${esc(fearPhrase())}</strong></div></div></div></section>

      <section class="section belief"><div class="eyebrow" style="color:#bce8d0"><span class="eyebrow-dot"></span>O PONTO-CHAVE</div><h2>Talvez você não precise da 7ª mamadeira. Precisa de uma sequência.</h2><p>Você já mudou <strong>${esc(triedPhrase())}</strong>. O objetivo do método é parar de mexer em várias variáveis ao mesmo tempo e aplicar uma sequência curta, observável e sem pressão.</p></section>

      <section class="section"><div class="eyebrow"><span class="eyebrow-dot"></span>COMO O PRODUTO SERÁ ORGANIZADO</div><h2>3 dias. Uma sequência clara.</h2><div class="plan-days"><div class="day"><div class="day-num">DIA<br>1</div><div><strong>Organizar o cenário e reduzir ruído</strong><p>Escolher uma configuração consistente, registrar o ponto de partida e remover mudanças aleatórias.</p></div></div><div class="day"><div class="day-num">DIA<br>2</div><div><strong>Repetir com intenção e observar resposta</strong><p>Manter uma sequência de baixa pressão, registrar o que melhora/piora e evitar forçar a alimentação.</p></div></div><div class="day"><div class="day-num">DIA<br>3</div><div><strong>Consolidar o melhor contexto</strong><p>Repetir o cenário mais promissor, preparar o cuidador e decidir se é hora de manter, ajustar ou buscar suporte profissional.</p></div></div></div></section>

      <section class="section offer"><div class="offer-kicker">OFERTA QUE ESTE QUIZ VAI VENDER</div><h2>Método Mamadeira em 3 Dias</h2><p>Um protocolo curto e personalizado para ajudar mães que amamentam a sair das tentativas aleatórias e buscar a aceitação da mamadeira antes da volta ao trabalho.</p><div class="price"><strong>US$17</strong><span>pagamento único</span></div><ul class="stack"><li>Protocolo de 3 dias de acordo com o perfil identificado</li><li>Mapa do que já foi tentado para não repetir o mesmo ciclo</li><li>Checklist de preparação para cuidador/daycare</li><li>Tracker simples para registrar resposta às tentativas</li><li>Ponto claro de “pare o DIY e procure ajuda”</li></ul><button class="primary" id="checkout">Quero acessar meu protocolo de 3 dias</button><div class="checkout-note">Botão demonstrativo — checkout ainda não conectado.</div></section>

      <section class="section placeholder"><strong>ÁREA DE PROVA SOCIAL</strong><p>Aqui entraremos apenas com depoimentos reais/validados. No protótipo deixei o espaço para você avaliar a ordem da página.</p></section>

      <section class="section"><h2>Antes de testar em tráfego</h2><p>Este protótipo serve para validar <strong>fluxo, sensação, ordem, copy e identidade visual</strong>. A promessa, conteúdo do protocolo, termos clínicos e versão em inglês americano ainda precisam de revisão final.</p><button class="secondary" id="restart">Refazer o quiz para testar outro caminho</button></section>
      <p class="footer-note">Material educacional. Não substitui pediatra, consultora de lactação, fonoaudiólogo/feeding therapist ou outro profissional qualificado.</p>
    </main>`;
    document.querySelector('#checkout')?.addEventListener('click',()=>{track('CheckoutClick',{prototype:true}); toast('Protótipo: aqui vamos conectar o checkout depois.');});
    document.querySelector('#restart')?.addEventListener('click',reset);
    track('ResultViewed',{profile:profile.name});
  }

  function render(){
    const s=currentScreen();
    if(s.type==='result') return renderResult();
    if(s.type==='analysis'){
      app.innerHTML=renderAnalysis();
      track('AssessmentAnalysisViewed');
      window.setTimeout(()=>{ state.current=Math.min(state.current+1,screens.length-1); persist(); render(); },2350);
      return;
    }
    if(s.type==='insight') app.innerHTML=renderInsight();
    else app.innerHTML=renderQuestion(s);

    track(`Step${String(state.current+1).padStart(2,'0')}Viewed`,{step_id:s.id,question_number:realQuestionIndex()});
    bind(s);
  }

  function bind(s){
    document.querySelector('#back')?.addEventListener('click',()=>{
      if(state.current<=0) return;
      state.current--;
      if(currentScreen().type==='analysis') state.current--;
      persist(); render(); window.scrollTo({top:0,behavior:'smooth'});
    });
    if(s.type==='insight'){
      document.querySelector('#continue')?.addEventListener('click',()=>completeAndNext(s));
      return;
    }
    document.querySelectorAll('[data-option]').forEach(btn=>btn.addEventListener('click',()=>{
      const value=btn.dataset.option;
      if(s.type==='single'){
        state.answers[s.id]=value; persist();
        document.querySelectorAll('[data-option]').forEach(x=>x.classList.toggle('selected',x.dataset.option===value));
        window.setTimeout(()=>completeAndNext(s),130);
      } else {
        let arr=Array.isArray(state.answers[s.id])?[...state.answers[s.id]]:[];
        if(s.safety){
          if(value==='none') arr=['none'];
          else { arr=arr.filter(x=>x!=='none'); arr=arr.includes(value)?arr.filter(x=>x!==value):[...arr,value]; }
        } else {
          if(value==='few') arr=['few'];
          else { arr=arr.filter(x=>x!=='few'); arr=arr.includes(value)?arr.filter(x=>x!==value):[...arr,value]; }
        }
        state.answers[s.id]=arr; persist();
        render();
      }
    }));
    document.querySelector('#continue')?.addEventListener('click',()=>completeAndNext(s));
  }

  function completeAndNext(s){
    track(`Step${String(state.current+1).padStart(2,'0')}Completed`,{step_id:s.id,question_number:realQuestionIndex()});
    state.current=Math.min(state.current+1,screens.length-1); persist(); render(); window.scrollTo({top:0,behavior:'smooth'});
  }

  function toast(msg){
    document.querySelector('.toast')?.remove();
    const el=document.createElement('div'); el.className='toast'; el.textContent=msg; document.body.appendChild(el); setTimeout(()=>el.remove(),2600);
  }
  function esc(value){
    return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  track('LandingView',{prototype:true});
  render();
})();
