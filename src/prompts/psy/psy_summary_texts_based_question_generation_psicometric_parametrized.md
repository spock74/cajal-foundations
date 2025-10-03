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