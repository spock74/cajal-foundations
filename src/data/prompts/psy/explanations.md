
> ainda nao, perdao. voce poderia escrever no camva cada prompt completo? considerando que estou partindo do pressuposto que ja terei os resumos, ou seja a fase de conversao de varios artigos nos documentos de variados eicoss do assunto total tratado

Compreendido. Peço perdão pela falta de clareza anterior. Vamos agora detalhar os prompts completos, um a um, no formato "tela" que você solicitou, assumindo o seu novo ponto de partida: você já possui um texto de resumo consolidado e quer usá-lo como base para as ações seguintes.

Esta premissa simplifica e otimiza o fluxo. A "matéria-prima" para a geração de avaliações não será mais o texto integral dos artigos, mas sim este **documento de resumo consolidado**.

A seguir, apresento a arquitetura de prompts completa para cada tarefa, a partir deste novo pressuposto.

-----

### **Tela 1: Prompt para Geração de Avaliação (a partir de um Resumo)**

Este é o prompt principal que você usaria para criar uma nova avaliação. Ele é parametrizado para lhe dar controlo total sobre a estrutura do teste.

```prompt
# PERSONA
Você é um psicometrista e especialista em avaliação educacional para a área da saúde, com a tarefa de criar avaliações de alta qualidade a partir de um resumo técnico.

# CONTEXTO
O texto a seguir é um resumo consolidado de quatro artigos científicos sobre insuficiência cardíaca diastólica (HFpEF). Este resumo será a única fonte de verdade para a criação das questões. A avaliação destina-se a estudantes de Medicina do 2º ano no Brasil.

# TAREFA
Gere uma avaliação completa seguindo rigorosamente os parâmetros de estrutura e as regras de qualidade abaixo.

# PARÂMETROS DA AVALIAÇÃO
{
  "numeroDeQuestoes": 10,
  "distribuicaoBloom": {
    "Compreender": "40%",
    "Aplicar": "30%",
    "Analisar": "30%"
  },
  "distribuicaoTRI": {
    "facil (b < -1.0)": "30%",
    "media (-1.0 <= b <= 1.0)": "50%",
    "dificil (b > 1.0)": "20%"
  }
}

# REGRAS E DIRETRIZES DE QUALIDADE
1.  **Fonte Única:** Baseie TODAS as questões e alternativas estritamente nas informações contidas no {TEXTO_DO_RESUMO_CONSOLIDADO} fornecido abaixo. Não use conhecimento externo.
2.  **Distribuição:** Cumpra as distribuições percentuais para os níveis de Bloom e as faixas de dificuldade da TRI especificadas nos PARÂMETROS.
3.  **Qualidade dos Itens:**
    * **Enunciado:** Deve ser claro e inequívoco.
    * **Alternativa Correta:** Deve ser factualmente correta e defensável com base no texto-fonte.
    * **Distratores:** As 3 alternativas incorretas devem ser plausíveis e projetadas para capturar erros conceituais comuns, não devem ser obviamente falsas.
4.  **Metadados:** Para cada questão, forneça todos os metadados solicitados no formato de saída, incluindo o racional para cada alternativa e a sua estimativa para o parâmetro 'b' da TRI.

# FORMATO DE SAÍDA
Responda estritamente em formato JSON, seguindo a estrutura exata do schema fornecido, preenchendo todos os campos.

{
  "assessment": {
    "assessmentId": "<gere um uuid-v4>",
    "title": "Avaliação Diagnóstica: Tópicos Avançados em HFpEF",
    "items": [
      {
        "itemId": "<gere um uuid-v4>",
        "questionNumber": <integer>,
        "pedagogicalMetadata": {
          "bloomLevel": "<Compreender, Aplicar, ou Analisar>",
          "contentTopics": ["<Array de tópicos relevantes>"]
        },
        "psychometricMetadata": {
          "irtParameters": {
            "estimated": {
              "b": <float, sua estimativa de dificuldade>
            }
          }
        },
        "content": {
          "itemType": "multiple-choice",
          "stem": "<Enunciado da questão>",
          "options": [
            {"key": "a", "text": "<Texto da alternativa A>"},
            {"key": "b", "text": "<Texto da alternativa B>"},
            {"key": "c", "text": "<Texto da alternativa C>"},
            {"key": "d", "text": "<Texto da alternativa D>"}
          ]
        },
        "answer": {
          "correctKeys": ["<key da alternativa correta>"],
          "rationale": "<Explicação detalhada de por que a resposta é correta.>",
          "distractorAnalysis": [
            {"key": "a", "targetedMisconception": "<Explique por que esta alternativa está incorreta e qual erro conceitual ela visa capturar.>"},
            {"key": "b", "targetedMisconception": "<Explique por que esta alternativa está incorreta...>"},
            ...
          ]
        },
        "hint": "<Dica para guiar o raciocínio do aluno.>"
      },
      ... (restante das questões)
    ]
  }
}

# TEXTO-FONTE
{TEXTO_DO_RESUMO_CONSOLIDADO}:
"""
[Aqui você colaria o texto completo do "Resumo Abrangente sobre Vacinação, Terapia com Estatinas e Novos Alvos de Drogas em Doenças Cardíacas Diastólicas" que analisamos anteriormente.]
"""
```

-----

### **Tela 2: Prompt para Diagnóstico do Erro (após o aluno responder)**

Este prompt não muda com a nova premissa, pois ele não opera sobre o texto-fonte, mas sim sobre a **interação do aluno com uma questão específica**. Ele continua a ser a etapa de "alta inteligência" do seu sistema.

```prompt
# PERSONA
Você é um especialista em diagnóstico pedagógico e ciência de dados educacionais. Sua função é inferir a causa-raiz de um erro de um aluno, considerando o seu histórico de aprendizagem.

# CONTEXTO
Um aluno de Medicina do 2º ano respondeu incorretamente a uma questão de uma avaliação. Temos a questão, a resposta dele e um resumo do seu desempenho histórico.

# TAREFA
1.  **Analise o Erro Específico:** Compare a {RESPOSTA_INCORRETA_DO_ALUNO} com a {RESPOSTA_CORRETA} e o {RATIONAL_DA_QUESTAO}. Identifique o erro conceitual pontual.
2.  **Analise o Padrão Histórico:** Leia o {VETOR_HISTORICO} do aluno. O erro atual é uma manifestação de um padrão recorrente (e.g., dificuldade com um nível de Bloom específico, com um tópico, etc.)?
3.  **Sintetize o Diagnóstico:** Com base em 1 e 2, escreva um diagnóstico conciso da lacuna de conhecimento do aluno.
4.  **Gere a Diretiva:** Crie uma diretiva de intervenção clara e acionável em formato JSON, projetada para corrigir a causa-raiz do erro e, se aplicável, reforçar a fraqueza de longo prazo.

# FORMATO DE SAÍDA
Responda estritamente em formato JSON com a seguinte estrutura:
{
  "diagnosis": "<Seu diagnóstico conciso.>",
  "directive": {
    "action": "generate_formative_items",
    "quantity": 3,
    "topic": "<Tópico específico a ser reforçado>",
    "bloomLevel": "<Nível de Bloom a ser focado>",
    "focus": "<Instrução detalhada para a IA de geração, explicando o objetivo pedagógico das novas questões.>"
  }
}

# DADOS DE ENTRADA
{DADOS_DA_QUESTAO}: {
  "stem": "Enunciado da questão original...",
  "options": [...],
  "bloomLevel": "Analisar",
  "contentTopics": ["Fisiologia Renal", "RAAS"]
}
{RESPOSTA_INCORRETA_DO_ALUNO}: "b"
{RESPOSTA_CORRETA}: "d"
{RATIONAL_DA_QUESTAO}: {
  "rationale_correta": "...",
  "analise_distrator_b": "Confunde o efeito na mortalidade com o efeito na hospitalização."
}
{VETOR_HISTORICO}: "Aluno demonstra forte memorização de fatos, mas apresenta dificuldade recorrente em questões de 'Analisar' que exigem a interpretação de dados de ensaios clínicos."
```

Esta estrutura de prompts cria um pipeline claro: o primeiro prompt usa um texto de resumo para **criar** o instrumento de avaliação. Os prompts subsequentes usam a **interação do aluno** com esse instrumento para **diagnosticar e intervir**, completando o ciclo de aprendizagem adaptativa.

---


> a avaliacao que voce cripu, eu estou supongo ue usou os cinco resumos do 2.5-flash-lite, estou certo? que a avaliacao cobre o conteudo de todos.

Não, a sua suposição não está correta, e este é um ponto metodológico fundamental.

A avaliação de 10 questões que eu criei **não foi baseada nos cinco resumos** gerados pelo `gemini-2.5-flash-lite`. Ela foi gerada utilizando como fonte os **textos integrais dos quatro artigos científicos originais** que você me forneceu anteriormente.

### Racional da Escolha Metodológica

A decisão de usar as fontes primárias (os artigos completos) em vez das fontes secundárias (os resumos) é deliberada e crucial para garantir a máxima qualidade e validade da avaliação. As razões são as seguintes:

1.  **Profundidade e Granularidade:** Os artigos originais contêm um nível de detalhe, dados estatísticos específicos (como os valores exatos de Hazard Ratio e Intervalos de Confiança), nuances na discussão e limitações que são inevitavelmente perdidos ou condensados num resumo. Para criar questões de alta qualidade, especialmente as de nível "Análise" e "Aplicação" (como a do cenário clínico da Questão 6), e para formular distratores plausíveis e tecnicamente defensáveis, é imperativo ter acesso à totalidade da informação.

2.  **Evitar a Propagação de Erros em Cascata:** Utilizar um resumo gerado por uma IA como fonte para uma segunda geração de IA (as questões) introduz um risco de propagação de erros. Se o resumo inicial, por melhor que seja, contiver uma pequena imprecisão ou omissão, essa falha seria herdada e potencialmente amplificada nas questões da avaliação. Ir diretamente à fonte de verdade (os artigos) minimiza este risco.

3.  **Validade para Questões de Síntese:** Para criar uma questão de síntese genuína como a Questão 10 ("...qual é o tema comum mais forte que conecta...?"), o modelo precisa de ter o contexto completo de todos os artigos para poder comparar as suas discussões e conclusões em profundidade, em vez de apenas comparar os seus resumos.

Portanto, para garantir o rigor psicométrico e a fidelidade factual que discutimos, o procedimento correto — e o que foi seguido — é sempre basear a geração de itens de avaliação na fonte de conhecimento mais completa e primária disponível. Os cinco resumos são excelentes como "objetos pedagógicos" finais, mas não como a matéria-prima para a criação de uma avaliação de alta precisão.

> considerando que a entrada para geracao de prova sao os artigos na integra, e eu te confundi, falando em resumos, o prompt correspondente o "Tela 1: Prompt para Geração de Avaliação (a partir de um Resumo)" acima fala em resumo consolidado --> deverá ser nao ""resumo consolidado"" mas sim "os artigos cientificos abaixo" ... ?
---

Correto. A sua clarificação é essencial e você está a apontar uma inconsistência importante que surgiu da nossa troca de ideias. Peço desculpa pela falta de clareza.

A premissa correta, conforme a nossa estratégia final, é que a **geração da avaliação principal (a tarefa de baixo volume e alto valor)** deve utilizar os **artigos na íntegra** para garantir a máxima qualidade. A utilização de resumos seria para outras tarefas, ou para um fluxo de trabalho mais simplificado.

A seguir, apresento a versão corrigida e final do **Prompt "Tela 1"**, ajustado para refletir este fluxo de trabalho correto.

-----

### **Tela 1 (Versão Corrigida): Prompt para Geração de Avaliação (a partir dos Artigos Integrais)**

Este é o prompt mestre que a sua aplicação enviaria para a IA (modelo `gemini-2.5-pro`) para criar a avaliação "padrão-ouro" para um determinado tópico.

```prompt
# PERSONA
Você é um psicometrista e especialista em avaliação educacional, com profundo conhecimento em Fisiologia e Cardiologia. Sua função é criar itens de avaliação de alta qualidade para estudantes de Medicina do 2º ano no Brasil, baseando-se em literatura científica primária.

# CONTEXTO
Você tem acesso ao texto integral de quatro (4) artigos científicos sobre insuficiência cardíaca diastólica (HFpEF). Estes documentos serão a única fonte de verdade para a criação das questões.

# TAREFA
Gere uma avaliação completa seguindo rigorosamente os parâmetros de estrutura e as regras de qualidade abaixo.

# PARÂMETROS DA AVALIAÇÃO
{
  "numeroDeQuestoes": 10,
  "distribuicaoBloom": {
    "Compreender": "40%",
    "Aplicar": "30%",
    "Analisar": "30%"
  },
  "distribuicaoTRI": {
    "facil (b < -1.0)": "30%",
    "media (-1.0 <= b <= 1.0)": "50%",
    "dificil (b > 1.0)": "20%"
  }
}

# REGRAS E DIRETRIZES DE QUALIDADE
1.  **Fonte Única:** Baseie TODAS as questões e alternativas estritamente nas informações contidas nos {TEXTOS_INTEGRAIS_DOS_ARTIGOS} fornecidos abaixo. Não use conhecimento externo.
2.  **Distribuição:** Cumpra as distribuições percentuais para os níveis de Bloom e as faixas de dificuldade da TRI especificadas nos PARÂMETROS.
3.  **Qualidade dos Itens:**
    * **Enunciado:** Deve ser claro e inequívoco.
    * **Alternativa Correta:** Deve ser factualmente correta e defensável com base nos textos-fonte.
    * **Distratores:** As 3 alternativas incorretas devem ser plausíveis e projetadas para capturar erros conceituais comuns, informações parcialmente corretas ou conceitos corretos mas que não respondem à pergunta. Evite alternativas absurdas.
4.  **Metadados:** Para cada questão, forneça todos os metadados solicitados no formato de saída, incluindo o racional para cada alternativa e a sua estimativa para o parâmetro 'b' da TRI.

# FORMATO DE SAÍDA
Responda estritamente em formato JSON, seguindo a estrutura exata do schema fornecido, preenchendo todos os campos.

{
  "assessment": {
    "assessmentId": "<gere um uuid-v4>",
    "title": "Avaliação Diagnóstica: Tópicos Avançados em HFpEF",
    "items": [
      {
        "itemId": "<gere um uuid-v4>",
        "questionNumber": <integer>,
        "pedagogicalMetadata": {
          "bloomLevel": "<Compreender, Aplicar, ou Analisar>",
          "contentTopics": ["<Array de tópicos relevantes extraídos dos artigos>"]
        },
        "psychometricMetadata": {
          "irtParameters": {
            "estimated": {
              "b": <float, sua estimativa de dificuldade>
            }
          }
        },
        "content": {
          "itemType": "multiple-choice",
          "stem": "<Enunciado da questão>",
          "options": [
            {"key": "a", "text": "<Texto da alternativa A>"},
            {"key": "b", "text": "<Texto da alternativa B>"},
            {"key": "c", "text": "<Texto da alternativa C>"},
            {"key": "d", "text": "<Texto da alternativa D>"}
          ]
        },
        "answer": {
          "correctKeys": ["<key da alternativa correta>"],
          "rationale": "<Explicação detalhada de por que a resposta é correta.>",
          "distractorAnalysis": [
            {"key": "a", "targetedMisconception": "<Explique por que esta alternativa está incorreta e qual erro conceitual ela visa capturar.>"},
            {"key": "b", "targetedMisconception": "<Explique por que esta alternativa está incorreta...>"},
            ...
          ]
        },
        "hint": "<Dica para guiar o raciocínio do aluno.>"
      },
      ... (restante das questões)
    ]
  }
}

# TEXTOS-FONTE
{TEXTOS_INTEGRAIS_DOS_ARTIGOS}:
"""
[Aqui você colaria o texto completo e consolidado dos quatro artigos científicos, um após o outro.]
"""
```

**Alterações Realizadas e Justificativa:**

1.  **`CONTEXTO`:** A descrição foi alterada de "resumo consolidado" para **"texto integral de quatro artigos científicos"**.
2.  **`REGRAS E DIRETRIZES`:** A regra de "Fonte Única" foi ajustada para referenciar a nova variável de entrada.
3.  **`TEXTOS-FONTE`:** A variável de entrada foi renomeada para **`{TEXTOS_INTEGRAIS_DOS_ARTIGOS}`** para máxima clareza.

Esta versão do prompt alinha-se com a nossa estratégia final: utilizar o modelo mais potente (`pro`) na tarefa de baixa frequência e alto valor (criação da avaliação "padrão-ouro"), fornecendo-lhe o máximo de contexto (os artigos completos) para garantir a máxima qualidade, profundidade e validade psicométrica.


----

> essa eh uma mudanca grande na minha questao, incluindo uma pergunta anterior que os usos do modelo pro seriam de entrada com numero muito peueno de tokens, o que nao é o caso agora considerando a entrada integrao dos artigos para geracao da avaliacao

Você está absolutamente correto em apontar esta aparente contradição. A sua observação é perspicaz e força-nos a refinar a nossa estratégia de alocação de modelos, distinguindo claramente os diferentes tipos de tarefas e as suas frequências.

A minha afirmação anterior de que o `pro` seria usado para "micro-tarefas" e a sua observação de que a geração da avaliação usa os "artigos na íntegra" parecem contraditórias, mas na verdade descrevem duas fases distintas e complementares da operação da sua plataforma.

Vamos clarificar a estratégia de alocação de modelos, pois ela depende da **natureza** e da **frequência** da tarefa.

### Estratégia de Alocação de Modelos: Tarefas de Baixa vs. Alta Frequência

Podemos dividir as operações da sua plataforma em duas categorias principais:

**1. Tarefas de Geração de "Ativos Pedagógicos" (Baixa Frequência, Alto Valor)**

* **Descrição:** São as tarefas executadas pelo **professor** para criar um material durável e reutilizável. A criação de uma avaliação diagnóstica principal para um novo tópico é um exemplo perfeito. Esta ação acontece poucas vezes (e.g., uma vez por capítulo ou por semana).
* **Prioridade Principal:** **Qualidade Máxima.** O objetivo é criar a melhor avaliação possível, o "padrão-ouro", que será a base para todo o ciclo de diagnóstico e intervenção. A validade psicométrica e a qualidade do conteúdo são primordiais.
* **Modelo Recomendado e Custo:** **`Gemini 2.5 Pro`**. Sim, esta tarefa envolve um grande volume de entrada (~37.100 tokens, no nosso exemplo). No entanto, como é uma tarefa de baixa frequência, o custo mais elevado é justificável como um "investimento" na criação do ativo.

    * **Recálculo do Custo para a Geração da Avaliação (com `gemini-2.5-pro`):**
        * Input: ~37.100 tokens
        * Output (Avaliação de 10 questões com metadados): ~1.500 tokens
        * Custo de Entrada: `(37.100 / 1M) * $1,25 * 7,0 =` **R$ 0,32**
        * Custo de Saída: `(1.500 / 1M) * $10,00 * 7,0 =` **R$ 0,105**
        * **Custo Total da Geração da Avaliação:** **~R$ 0,43**

    Um custo de menos de 50 centavos de Real para gerar uma avaliação completa, robusta e reutilizável, que servirá de base para o aprendizado de dezenas de alunos, é um investimento de altíssimo retorno.

**2. Tarefas de Intervenção Formativa (Alta Frequência, Custo-Sensível)**

* **Descrição:** São as tarefas executadas **automaticamente pelo sistema** em resposta às interações de **cada aluno**. O ciclo de "diagnosticar erro -> gerar questões de reforço" acontece centenas ou milhares de vezes por turma ao longo de um semestre.
* **Prioridade Principal:** **Eficiência de Custo e Velocidade.** A intervenção precisa de ser instantânea e barata para ser escalável.
* **Modelo Recomendado e Custo:** **Arquitetura Híbrida v3.0.** É aqui que a premissa de "inputs pequenos para o `pro`" se mantém verdadeira.
    * **Diagnóstico (`pro`):** O input é mínimo (~500 tokens: a questão, a resposta do aluno, o vetor histórico). O custo é ínfimo.
    * **Geração (`-lite`):** A execução da diretiva para gerar 3-5 questões também é uma tarefa de baixo custo.
    * **Custo Total da Intervenção:** Como calculamos, cerca de **~R$ 0,007** por ciclo de intervenção.

### Tabela Comparativa da Estratégia de Alocação

| Tipo de Tarefa | Frequência de Uso | Prioridade Principal | Modelo(s) Recomendado(s) | Custo Estimado (BRL) | Justificativa Estratégica |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Geração de Ativos (Professor)**| Baixa (e.g., 1x por tópico)| Qualidade Máxima | `gemini-2.5-pro` | **~R$ 0,43** por avaliação | Investimento único para criar um recurso "padrão-ouro" reutilizável. |
| **Intervenção Formativa (Aluno)** | Altíssima (contínua)| Custo-Eficiência | `pro` (micro-diagnóstico) + `-lite` (geração)| **~R$ 0,007** por intervenção | Custo marginal baixo permite escalabilidade massiva e feedback instantâneo. |

**Conclusão:**

Você está correto em observar que a geração da avaliação principal com o `pro` envolve um grande volume de entrada. A nossa estratégia, portanto, não é *nunca* usar o `pro` com grandes inputs, mas sim **alocar este custo elevado a uma tarefa de baixa frequência e alto valor estratégico (a criação do material base)**.

As tarefas de alta frequência, que são as que verdadeiramente impulsionam o custo em escala, continuam a usar a arquitetura otimizada, com inputs muito pequenos para o `pro` e a carga de geração de texto no modelo `-lite`. Esta distinção resolve a aparente contradição e forma a base de um modelo de FinOps robusto para a sua plataforma.

