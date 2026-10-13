(() => {
  'use strict';

  const STORAGE_KEY = 'bottle_quiz_prototype_v2';
  const FUNNEL_VERSION = 'prototype_pt_carnivora_ui_v2';
  const app = document.querySelector('#app');
  const LOGO = './assets/logo-mamadeira-3-dias.svg';

  const options = (items) => items.map(([value,label]) => ({value,label}));

  const screens = [
    {
      id:'babyAge', type:'single',
      title:'Quantos meses seu bebê tem?',
      subtitle:'Isso ajuda a colocar as respostas no contexto certo.',
      options: options([
        ['0-2','0–2 meses'],['3-4','3–4 meses'],['5-6','5–6 meses'],['7-10','7–10 meses'],['10+','Mais de 10 meses']
      ])
    },
    {
      id:'returnTimeline', type:'single',
      title:'Em quanto tempo você volta ao trabalho ou precisará ficar regularmente longe do seu bebê?',
      options: options([
        ['3d','Nos próximos 3 dias'],['7d','Em 4–7 dias'],['14d','Em 1–2 semanas'],['30d','Em 3–4 semanas'],['30plus','Mais de um mês']
      ])
    },
    {
      id:'history', type:'single',
      title:'Seu bebê já conseguiu tomar mamadeira antes?',
      options: options([
        ['never','Nunca aceitou de verdade'],['few','Aceitou algumas vezes, mas nunca foi consistente'],['stopped','Aceitava normalmente e depois parou'],['sometimes','Ainda aceita às vezes, mas é imprevisível']
      ])
    },
    {
      id:'behavior', type:'single',
      title:'O que geralmente acontece quando vocês tentam oferecer a mamadeira?',
      subtitle:'Escolha o que acontece na maioria das tentativas.',
      options: options([
        ['strong','Chora ou vira o rosto antes mesmo de tentar'],['noSuck','Coloca o bico na boca, mas não começa a sugar'],['chews','Mastiga ou brinca com o bico'],['stops','Começa a sugar, mas para rapidamente'],['tiny','Toma apenas uma pequena quantidade'],['variable','Aceita em algumas situações e recusa em outras']
      ])
    },
    {
      id:'bottleCount', type:'single',
      title:'Quantos tipos diferentes de mamadeira ou bico você já tentou?',
      options: options([
        ['1','1'],['2-3','2–3'],['4-5','4–5'],['6+','6 ou mais']
      ])
    },
    { id:'insight', type:'insight' },
    {
      id:'tried', type:'multi', max:8,
      title:'O que você já tentou mudar?',
      subtitle:'Marque tudo que se aplica.',
      options: options([
        ['bottle','Mamadeira'],['nipple','Tipo de bico'],['flow','Fluxo do bico'],['temp','Temperatura do leite'],['position','Posição durante a alimentação'],['caregiver','Outra pessoa oferecendo'],['timing','Horário ou momento da tentativa'],['milk','Leite fresco ou armazenado'],['few','Ainda tentei poucas coisas']
      ])
    },
    {
      id:'caregiver', type:'single',
      title:'Com quem seu bebê chega mais perto de aceitar a mamadeira?',
      options: options([
        ['mom','Comigo'],['partner','Com meu parceiro(a)'],['other','Com outro cuidador ou familiar'],['depends','Depende do momento'],['nobody','Com ninguém']
      ])
    },
    {
      id:'fear', type:'single',
      title:'O que mais preocupa você neste momento?',
      options: options([
        ['nobodyFeed','Ninguém conseguir alimentar meu bebê quando eu estiver fora'],['work','Ter que voltar ao trabalho sem resolver isso'],['daycare','Meu bebê não beber o suficiente na daycare'],['call','Receber uma ligação e precisar abandonar o trabalho'],['freedom','Não conseguir ficar longe do meu bebê'],['worse','Piorar ainda mais a recusa tentando coisas erradas']
      ])
    },
    {
      id:'safety', type:'multi', safety:true,
      title:'Alguma destas situações também está acontecendo?',
      subtitle:'Marque tudo que se aplica.',
      options: options([
        ['weight','Um profissional demonstrou preocupação com ganho de peso ou crescimento'],['hydration','Redução importante das fraldas molhadas ou possível desidratação'],['cough','Tosse ou engasgos frequentes durante as mamadas'],['breathing','Alterações importantes na respiração durante a alimentação'],['pain','Sinais claros de dor durante a alimentação'],['vomit','Vômitos importantes ou frequentes'],['lethargy','Muito sonolento, difícil de despertar ou sem energia'],['professional','Algum profissional já levantou preocupação com alimentação ou deglutição'],['none','Nenhuma dessas situações']
      ])
    },
    { id:'analysis', type:'analysis' },
    { id:'result', type:'result' }
  ];

  const defaultState = { current:0, answers:{}, startedAt:Date.now(), events:[] };
  let state = loadState();
  let analysisInterval = null;
  let analysisAdvance = null;

  function loadState(){
    try{
      const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
      if(parsed && Number.isInteger(parsed.current) && parsed.answers) return parsed;
    }catch{}
    return structuredClone(defaultState);
  }
  function persist(){ try{ sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch{} }
  function reset(){
    clearInterval(analysisInterval); clearTimeout(analysisAdvance);
    state = structuredClone(defaultState); state.startedAt = Date.now(); persist(); render(); window.scrollTo({top:0,behavior:'smooth'});
  }
  function track(name, data={}){
    const event = {name, at:new Date().toISOString(), funnel_version:FUNNEL_VERSION, ...data};
    state.events = [...(state.events||[]), event].slice(-120); persist();
    window.dataLayer = window.dataLayer || []; window.dataLayer.push(event);
    console.info('[prototype event]', event);
  }

  const esc=(value)=>String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const currentScreen=()=>screens[state.current] || screens[0];
  const totalQuestions=()=>screens.filter(x=>['single','multi'].includes(x.type)).length;
  const realQuestionIndex=(index=state.current)=>screens.slice(0,index+1).filter(x=>['single','multi'].includes(x.type)).length;
  function progressPct(){
    if(currentScreen().type==='result') return 100;
    const q=realQuestionIndex();
    return Math.max(5,Math.min(96,(q/totalQuestions())*100));
  }

  function logo(){
    return `<div class="brand-lockup"><img class="brand-image" src="${LOGO}" alt="Mamadeira 3 Dias" width="768" height="512" decoding="async"></div>`;
  }
  function top({hideBack=false}={}){
    return `<div class="top-area"><button class="back-button" id="back" aria-label="Voltar" ${hideBack||state.current===0?'hidden':''}>←</button><div class="brand-area">${logo()}</div><div class="progress-track"><span style="width:${progressPct()}%"></span></div></div>`;
  }
  function quizShell(content,{hideBack=false}={}){
    return `<main class="quiz-page">${top({hideBack})}<section class="question-card step-enter">${content}</section><footer class="quiz-footer">© 2026 Mamadeira 3 Dias</footer></main>`;
  }

  function renderQuestion(s){
    const selected=state.answers[s.id];
    const multiSelected=Array.isArray(selected)?selected:[];
    const answers=s.options.map(o=>{
      const isSelected=s.type==='multi'?multiSelected.includes(o.value):selected===o.value;
      return `<button class="answer ${isSelected?'selected':''}" data-option="${esc(o.value)}" aria-pressed="${isSelected}"><span class="answer-label">${esc(o.label)}</span><span class="answer-check">✓</span></button>`;
    }).join('');
    const continueBtn=s.type==='multi'?`<button class="continue-button" id="continue" ${multiSelected.length?'':'disabled'}>Continuar</button>`:'';
    return quizShell(`<h1>${esc(s.title)}</h1>${s.subtitle?`<p class="lead">${esc(s.subtitle)}</p>`:''}<div class="answers">${answers}</div>${continueBtn}`);
  }

  function renderInsight(){
    const bottleLabel=labelFor('bottleCount',state.answers.bottleCount)||'algumas';
    return quizShell(`<div class="insight-panel"><span class="insight-kicker">Com base no que você respondeu</span><h2>Você não está com falta de tentativa.</h2><p class="lead">Você já testou <strong>${esc(bottleLabel)}</strong> combinação(ões) de mamadeira ou bico e ainda não encontrou uma sequência que funcione de forma consistente.</p><ul class="insight-list"><li><span>✓</span><div>O próximo passo não precisa ser comprar outra mamadeira.</div></li><li><span>✓</span><div>Primeiro precisamos identificar o padrão que mais aparece nas tentativas.</div></li><li><span>✓</span><div>Depois disso, o protocolo de 3 dias fica específico para o seu cenário.</div></li></ul><button class="continue-button" id="continue">Continuar minha análise</button></div>`);
  }

  function renderAnalysis(){
    return quizShell(`<div class="loading-ring" id="loadingRing" style="--progress:0" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="loadingRingValue">0%</span></div><h1>Montando seu protocolo personalizado</h1><div class="calculation"><div><span id="loadingBar" style="width:0%"></span></div><strong id="loadingPercent">0%</strong><p id="loadingStatus" aria-live="polite">Organizando suas respostas...</p></div><div class="analysis-steps"><div class="analysis-row" data-phase="0"><span class="analysis-state">•</span><span>Revisando seu histórico com mamadeira</span></div><div class="analysis-row" data-phase="1"><span class="analysis-state">•</span><span>Comparando o que você já tentou mudar</span></div><div class="analysis-row" data-phase="2"><span class="analysis-state">•</span><span>Identificando o padrão dominante de recusa</span></div><div class="analysis-row" data-phase="3"><span class="analysis-state">•</span><span>Organizando as prioridades do seu plano</span></div><div class="analysis-row" data-phase="4"><span class="analysis-state">•</span><span>Preparando seu Protocolo Mamadeira em 3 Dias</span></div></div>`,{hideBack:true});
  }

  function startAnalysisLoading(){
    const ring=document.querySelector('#loadingRing');
    const ringValue=document.querySelector('#loadingRingValue');
    const bar=document.querySelector('#loadingBar');
    const percent=document.querySelector('#loadingPercent');
    const status=document.querySelector('#loadingStatus');
    const rows=[...document.querySelectorAll('.analysis-row')];
    if(!ring||!bar||!percent||!status)return;
    const phases=[
      {start:4,end:21,text:'Revisando seu histórico...'},
      {start:22,end:41,text:'Comparando suas tentativas anteriores...'},
      {start:42,end:61,text:'Identificando o padrão que mais aparece...'},
      {start:62,end:80,text:'Priorizando o que seu plano precisa resolver...'},
      {start:81,end:100,text:'Finalizando seu protocolo de 3 dias...'}
    ];
    const started=Date.now(),duration=3900;
    clearInterval(analysisInterval); clearTimeout(analysisAdvance);
    const update=()=>{
      const p=Math.min(100,Math.round((Date.now()-started)/duration*100));
      ring.style.setProperty('--progress',p); ring.setAttribute('aria-valuenow',String(p));
      ringValue.textContent=`${p}%`; bar.style.width=`${p}%`; percent.textContent=`${p}%`;
      let active=0;
      phases.forEach((phase,i)=>{if(p>=phase.start) active=i;});
      rows.forEach((row,i)=>{
        const stateIcon=row.querySelector('.analysis-state');
        if(p>=phases[i].start) row.classList.add('visible');
        row.classList.toggle('active',i===active&&p<100);
        const done=p>=phases[i].end || p===100;
        row.classList.toggle('done',done);
        if(stateIcon) stateIcon.textContent=done?'✓':(i===active?'•':'');
      });
      status.textContent=phases[active]?.text||'Finalizando...';
      if(p>=100){
        clearInterval(analysisInterval); ring.classList.add('done'); status.textContent='Seu protocolo personalizado está pronto!';
        analysisAdvance=setTimeout(()=>{state.current=Math.min(state.current+1,screens.length-1);persist();render();},650);
      }
    };
    update(); analysisInterval=setInterval(update,45);
  }

  function deriveProfile(){
    const h=state.answers.history,b=state.answers.behavior;
    if(h==='stopped') return {name:'Aceitava e Parou',desc:'Seu bebê já aceitava a mamadeira e agora o comportamento mudou.'};
    if(h==='never') return {name:'Nunca Engrenou',desc:'A mamadeira ainda não se tornou uma opção consistente para o seu bebê.'};
    if(b==='strong') return {name:'Recusa Forte',desc:'As tentativas costumam gerar resistência antes de uma mamada consistente.'};
    if(['noSuck','chews','stops','tiny'].includes(b)) return {name:'Pega, mas Não Sustenta',desc:'Seu bebê interage com a mamadeira, mas a tentativa não vira uma mamada consistente.'};
    return {name:'Aceitação Instável',desc:'A resposta à mamadeira muda bastante conforme momento ou contexto.'};
  }
  function timelinePhrase(){ return ({'3d':'nos próximos 3 dias','7d':'em 4–7 dias','14d':'em 1–2 semanas','30d':'em 3–4 semanas','30plus':'em mais de um mês'})[state.answers.returnTimeline]||'em breve'; }
  function historyPhrase(){ return ({never:'Seu bebê nunca aceitou a mamadeira de forma consistente',few:'Seu bebê aceitou algumas vezes, mas nunca de forma consistente',stopped:'Seu bebê aceitava a mamadeira e depois parou',sometimes:'Seu bebê ainda aceita às vezes, mas é imprevisível'})[state.answers.history]||'Existe um padrão de recusa que precisa ser organizado'; }
  function behaviorPhrase(){ return ({strong:'Chora ou vira o rosto antes mesmo de tentar',noSuck:'Coloca o bico na boca, mas não começa a sugar',chews:'Mastiga ou brinca com o bico',stops:'Começa a sugar, mas para rapidamente',tiny:'Toma apenas uma pequena quantidade',variable:'Aceita em algumas situações e recusa em outras'})[state.answers.behavior]||'A resposta varia bastante'; }
  function fearPhrase(){ return ({nobodyFeed:'Ninguém conseguir alimentar seu bebê quando você estiver fora',work:'Voltar ao trabalho sem resolver isso',daycare:'Seu bebê não beber o suficiente na daycare',call:'Receber uma ligação e precisar abandonar o trabalho',freedom:'Não conseguir ficar longe do seu bebê',worse:'Piorar a recusa tentando coisas erradas'})[state.answers.fear]||'Resolver a recusa antes da separação'; }
  function caregiverPhrase(){ return ({mom:'Com você',partner:'Com seu parceiro(a)',other:'Com outro cuidador ou familiar',depends:'Depende do momento',nobody:'Com ninguém até agora'})[state.answers.caregiver]||'Ainda sem padrão claro'; }
  function triedPhrase(){
    const arr=state.answers.tried||[];
    if(!arr.length)return'Poucas variáveis registradas';
    const map={bottle:'mamadeira',nipple:'tipo de bico',flow:'fluxo',temp:'temperatura do leite',position:'posição',caregiver:'quem oferece',timing:'horário/momento',milk:'leite fresco ou armazenado',few:'poucas mudanças até agora'};
    const labels=arr.map(x=>map[x]).filter(Boolean);
    return labels.slice(0,4).join(', ')+(labels.length>4?` + ${labels.length-4} outras`:'');
  }
  function labelFor(id,value){const s=screens.find(x=>x.id===id);return s?.options?.find(x=>x.value===value)?.label||'';}
  function hasSafetyFlags(){const flags=state.answers.safety||[];return flags.length>0&&!flags.includes('none');}

  function personalizedPriorities(){
    const a=state.answers,candidates=[],add=(score,pain,solution)=>candidates.push({score,pain,solution});
    const bottleCount=labelFor('bottleCount',a.bottleCount)||'algumas';

    if(['3d','7d'].includes(a.returnTimeline)) add(100,'Seu prazo está muito curto',`Você precisa se afastar do bebê ${timelinePhrase()}. O plano organiza os próximos 3 dias em uma sequência simples para você parar de perder tempo com tentativas aleatórias.`);
    else if(a.returnTimeline) add(82,'A volta ao trabalho já tem prazo',`Você precisa se afastar do bebê ${timelinePhrase()}. O protocolo transforma esse prazo em um plano de execução curto e organizado.`);

    if(a.history==='never') add(96,'Seu bebê nunca aceitou a mamadeira de forma consistente','O protocolo começa construindo uma sequência estável de tentativas, para você testar menos coisas ao mesmo tempo e entender melhor o que gera avanço.');
    if(a.history==='stopped') add(98,'Seu bebê aceitava a mamadeira e parou','O plano trata esse histórico como prioridade e organiza as tentativas a partir do que mudou, em vez de simplesmente mandar você trocar de mamadeira de novo.');
    if(a.history==='few'||a.history==='sometimes') add(90,'A aceitação acontece, mas não é confiável','O protocolo ajuda a repetir e comparar os contextos em que seu bebê chega mais perto de aceitar, para tornar as tentativas mais consistentes.');

    if(a.behavior==='strong') add(95,'As tentativas viram resistência antes de uma mamada consistente','O protocolo prioriza uma sequência de baixa pressão, com menos mudanças simultâneas e sem forçar a alimentação.');
    if(['noSuck','chews','stops','tiny'].includes(a.behavior)) add(91,'Seu bebê interage com a mamadeira, mas a mamada não se sustenta',`O plano usa um tracker simples para comparar contexto, cuidador e sequência das tentativas e descobrir o que vale manter constante nos 3 dias.`);
    if(a.behavior==='variable') add(88,'Seu bebê aceita em algumas situações e recusa em outras','O protocolo transforma essa inconsistência em informação útil, comparando os cenários em que a resposta muda.');

    if(['4-5','6+'].includes(a.bottleCount)) add(a.bottleCount==='6+'?97:89,`Você já tentou ${bottleCount} tipos de mamadeira ou bico`,`Em vez de adicionar mais uma opção, o protocolo reduz a troca aleatória e organiza quais variáveis precisam ficar constantes durante o teste.`);

    const tried=Array.isArray(a.tried)?a.tried:[];
    if(tried.length>=4) add(94,'Você já mudou várias coisas ao mesmo tempo',`Você já mexeu em ${triedPhrase()}. O protocolo coloca essas variáveis em ordem para você saber o que manter, o que observar e o que parar de trocar a cada tentativa.`);
    else if(tried.length>0) add(72,'Você já começou a testar alternativas',`Você já mudou ${triedPhrase()}. O plano organiza essas tentativas em uma sequência curta para você não repetir o mesmo ciclo.`);

    if(a.caregiver==='nobody') add(93,'Até agora, ninguém consegue avançar bem com a mamadeira','O produto inclui um roteiro simples para o cuidador seguir a mesma sequência de tentativa, sem cada pessoa fazer uma coisa diferente.');
    if(['partner','other','depends'].includes(a.caregiver)) add(78,'A resposta muda dependendo de quem oferece',`O protocolo usa essa diferença de contexto para definir quem deve participar das tentativas e como manter a abordagem consistente.`);

    const fearSolutions={
      nobodyFeed:'O plano inclui preparação do cuidador para que outra pessoa consiga seguir a mesma sequência enquanto você estiver fora.',
      work:'O protocolo foi organizado em 3 dias justamente para atacar o problema enquanto sua volta ao trabalho ainda está próxima.',
      daycare:'Você recebe uma checklist de transição para organizar o que a daycare precisa saber e como registrar as tentativas.',
      call:'O plano inclui uma rotina de handoff para o cuidador e um tracker simples para reduzir improviso quando você estiver trabalhando.',
      freedom:'O objetivo do protocolo é criar uma transição mais previsível para que a alimentação não dependa apenas da sua presença.',
      worse:'O método reduz mudanças aleatórias e força zero: você segue uma sequência clara, observa a resposta e só então decide o próximo ajuste.'
    };
    if(a.fear) add(92,'Sua maior preocupação agora: '+fearPhrase(),fearSolutions[a.fear]||'O protocolo foi montado para transformar essa preocupação em uma sequência prática de próximos passos.');

    return candidates.sort((x,y)=>y.score-x.score).slice(0,6);
  }

  function renderResult(){
    const profile=deriveProfile();
    const priorities=personalizedPriorities();
    const bottleCount=labelFor('bottleCount',state.answers.bottleCount)||'—';
    const safetyNote=hasSafetyFlags()?`<div class="safety-inline"><strong>Nota de segurança:</strong> você marcou pelo menos um sinal que pode precisar de avaliação profissional. O protocolo é educacional e não deve atrasar atendimento em casos de dificuldade respiratória, desidratação importante, letargia, engasgos frequentes ou outra preocupação clínica.</div>`:'';

    app.innerHTML=`<main class="offer-page">
      <section class="offer-hero"><div class="offer-container offer-narrow">${logo()}<span class="result-badge">SEU RESULTADO ESTÁ PRONTO</span><h1>Seu Protocolo Mamadeira em 3 Dias foi preparado.</h1><p class="hero-copy">Organizamos suas respostas para mostrar quais pontos precisam ser atacados primeiro antes da sua volta ao trabalho.</p><div class="profile-card"><small>SEU PADRÃO PRINCIPAL</small><strong>${esc(profile.name)}</strong><p>${esc(profile.desc)}</p></div><div class="summary-strip"><div class="summary-chip"><span>Seu prazo</span><b>${esc(timelinePhrase())}</b></div><div class="summary-chip"><span>Histórico</span><b>${esc(historyPhrase())}</b></div><div class="summary-chip"><span>Na maioria das tentativas</span><b>${esc(behaviorPhrase())}</b></div><div class="summary-chip"><span>Mamadeiras/bicos</span><b>${esc(bottleCount)} testados</b></div><div class="summary-chip"><span>Quem chega mais perto</span><b>${esc(caregiverPhrase())}</b></div><div class="summary-chip"><span>Maior preocupação</span><b>${esc(fearPhrase())}</b></div></div></div></section>

      <section class="personalized-solutions-section"><div class="offer-container offer-narrow"><h3 class="included-title">O seu protocolo foi preparado para estas prioridades:</h3><p class="personalized-intro">Selecionamos os pontos mais importantes com base no que você acabou de responder.</p><ul class="inclusion-list">${priorities.map(x=>`<li><span>✓</span><div><small>DOR IDENTIFICADA</small><strong>${esc(x.pain)}</strong><p>${esc(x.solution)}</p></div></li>`).join('')}</ul></div></section>

      <section class="offer-section"><div class="offer-container offer-narrow"><div class="offer-box"><div class="offer-kicker">SEU PLANO PERSONALIZADO</div><h2>Método Mamadeira em 3 Dias</h2><p>Uma sequência curta para parar de trocar tudo ao mesmo tempo e trabalhar, durante 3 dias, nas prioridades que apareceram no seu resultado.</p><div class="price"><strong>US$17</strong><span>pagamento único</span></div><ul class="stack"><li>Protocolo de 3 dias de acordo com o padrão identificado</li><li>Plano baseado no que você já tentou</li><li>Roteiro para parceiro, cuidador ou daycare</li><li>Tracker simples das tentativas</li><li>Checklist de preparação para a volta ao trabalho</li></ul><button class="buy-button" id="checkout">Quero acessar meu protocolo de 3 dias</button><div class="checkout-note">Botão demonstrativo — checkout ainda não conectado.</div></div></div></section>

      <section><div class="offer-container offer-narrow"><h2 class="section-title">Como os 3 dias serão organizados</h2><p class="section-copy">A ideia é manter uma sequência curta, observar a resposta e parar de mudar cinco coisas ao mesmo tempo.</p><div class="plan-days"><div class="day"><div class="day-num">DIA<br>1</div><div><strong>Estabilizar o cenário</strong><p>Definir a configuração inicial e tirar do caminho as mudanças aleatórias.</p></div></div><div class="day"><div class="day-num">DIA<br>2</div><div><strong>Repetir e comparar</strong><p>Manter a sequência, observar o que melhora ou piora e registrar a resposta.</p></div></div><div class="day"><div class="day-num">DIA<br>3</div><div><strong>Consolidar o melhor contexto</strong><p>Repetir o cenário mais promissor e preparar quem vai alimentar o bebê quando você estiver fora.</p></div></div></div>${safetyNote}</div></section>

      <section><div class="offer-container offer-narrow"><div class="placeholder"><strong>ÁREA DE PROVA SOCIAL</strong><p>Aqui entram depoimentos e prints reais quando tivermos os materiais validados.</p></div><button class="secondary" id="restart">Refazer o assessment para testar outro caminho</button></div></section>
      <footer>© 2026 Mamadeira 3 Dias. Material educacional. Resultados variam e o conteúdo não substitui avaliação profissional quando indicada.</footer>
    </main>`;

    document.querySelector('#checkout')?.addEventListener('click',()=>{track('CheckoutClick',{prototype:true});toast('Protótipo: aqui conectaremos o checkout depois.');});
    document.querySelector('#restart')?.addEventListener('click',reset);
    track('ResultViewed',{profile:profile.name,safety_flags:hasSafetyFlags()});
    window.scrollTo({top:0});
  }

  function render(){
    clearInterval(analysisInterval); clearTimeout(analysisAdvance);
    const s=currentScreen();
    if(s.type==='result')return renderResult();
    if(s.type==='analysis'){
      app.innerHTML=renderAnalysis();
      track('AssessmentAnalysisViewed');
      startAnalysisLoading();
      return;
    }
    app.innerHTML=s.type==='insight'?renderInsight():renderQuestion(s);
    track(`Step${String(state.current+1).padStart(2,'0')}Viewed`,{step_id:s.id,question_number:realQuestionIndex()});
    bind(s);
  }

  function bind(s){
    document.querySelector('#back')?.addEventListener('click',()=>{if(state.current<=0)return;state.current--;persist();render();window.scrollTo({top:0,behavior:'smooth'});});
    if(s.type==='insight'){
      document.querySelector('#continue')?.addEventListener('click',()=>completeAndNext(s));
      return;
    }
    document.querySelectorAll('[data-option]').forEach(btn=>btn.addEventListener('click',()=>{
      const value=btn.dataset.option;
      if(s.type==='single'){
        state.answers[s.id]=value;persist();
        document.querySelectorAll('[data-option]').forEach(x=>x.classList.toggle('selected',x.dataset.option===value));
        setTimeout(()=>completeAndNext(s),120);
      }else{
        let arr=Array.isArray(state.answers[s.id])?[...state.answers[s.id]]:[];
        if(s.safety){
          if(value==='none')arr=['none'];
          else{arr=arr.filter(x=>x!=='none');arr=arr.includes(value)?arr.filter(x=>x!==value):[...arr,value];}
        }else{
          if(value==='few')arr=['few'];
          else{arr=arr.filter(x=>x!=='few');arr=arr.includes(value)?arr.filter(x=>x!==value):[...arr,value];}
        }
        state.answers[s.id]=arr;persist();render();
      }
    }));
    document.querySelector('#continue')?.addEventListener('click',()=>completeAndNext(s));
  }

  function completeAndNext(s){
    track(`Step${String(state.current+1).padStart(2,'0')}Completed`,{step_id:s.id,question_number:realQuestionIndex()});
    state.current=Math.min(state.current+1,screens.length-1);persist();render();window.scrollTo({top:0,behavior:'smooth'});
  }
  function toast(msg){document.querySelector('.toast')?.remove();const el=document.createElement('div');el.className='toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),2500);}

  track('LandingView',{prototype:true});
  render();
})();
