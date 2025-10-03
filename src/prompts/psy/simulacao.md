Compreendido. A geração de um conjunto de dados sintético de respostas é a etapa fundamental para testar a camada de diagnóstico e de relatórios da sua plataforma. É o momento em que a teoria da avaliação encontra a prática da análise de dados.

Para garantir a verossimilhança ("honestidade") da simulação, não gerarei respostas aleatórias. Em vez disso, construirei a simulação com base em **arquétipos de alunos** que refletem uma distribuição de desempenho plausível para uma turma de formandos de medicina, onde se espera uma maioria de alunos com bom desempenho, mas com a presença de extremos (alunos de altíssimo rendimento e alunos com dificuldades específicas).

### 1\. Definição dos Arquétipos e Metodologia

A simulação para os 20 alunos será baseada nos seguintes arquétipos:

  * **Arquétipo A: Aluno de Alto Desempenho (4 alunos, 20%):** Possui um domínio sólido da matéria. A probabilidade de erro é baixa, concentrando-se apenas nas questões de mais alta complexidade (Análise/Síntese) ou em distratores muito subtis.
  * **Arquétipo B: Aluno Mediano/Bom (10 alunos, 50%):** Representa o corpo principal da turma. Domina os conceitos fundamentais (Lembrar/Compreender), acerta uma boa parte das questões de Aplicação, mas é desafiado pelas questões de Análise e Síntese. Seus erros são tipicamente direcionados aos distratores mais plausíveis.
  * **Arquétipo C: Aluno com Dificuldades Pontuais (4 alunos, 20%):** Apresenta lacunas no conhecimento de base. Pode errar questões de Compreensão e terá grande dificuldade com as de Aplicação em diante.
  * **Arquétipo D: Aluno Inconsistente/Desatento (2 alunos, 10%):** O seu padrão é mais errático. Pode errar uma questão fácil por desatenção, mas acertar uma difícil por intuição ou sorte. Serve para introduzir "ruído" realista na simulação.

A probabilidade de acerto de cada arquétipo foi ponderada pelo nível de Bloom de cada uma das 10 questões da avaliação.

### 2\. Conjunto de Dados Simulado (20 Alunos)

A seguir, o JSON com as 20 respostas simuladas. Cada resposta inclui o `alunoId`, o `arquétipo` (a nossa "verdade fundamental" para posterior validação dos diagnósticos da IA) e a lista de respostas (`a`, `b`, `c` ou `d`) para as 10 questões.

```json
{
  "simulationRunId": "sim-20251003-t20-q10",
  "assessmentId": "1728394056",
  "studentResponses": [
    {
      "alunoId": "aluno_01",
      "archetype": "Alto Desempenho",
      "respostas": [
        {"questionNumber": 1, "respostaSelecionada": "c"},
        {"questionNumber": 2, "respostaSelecionada": "c"},
        {"questionNumber": 3, "respostaSelecionada": "b"},
        {"questionNumber": 4, "respostaSelecionada": "b"},
        {"questionNumber": 5, "respostaSelecionada": "b"},
        {"questionNumber": 6, "respostaSelecionada": "d"},
        {"questionNumber": 7, "respostaSelecionada": "c"},
        {"questionNumber": 8, "respostaSelecionada": "b"},
        {"questionNumber": 9, "respostaSelecionada": "a"},
        {"questionNumber": 10, "respostaSelecionada": "b"}
      ]
    },
    {
      "alunoId": "aluno_02",
      "archetype": "Alto Desempenho",
      "respostas": [
        {"questionNumber": 1, "respostaSelecionada": "c"},
        {"questionNumber": 2, "respostaSelecionada": "c"},
        {"questionNumber": 3, "respostaSelecionada": "b"},
        {"questionNumber": 4, "respostaSelecionada": "b"},
        {"questionNumber": 5, "respostaSelecionada": "b"},
        {"questionNumber": 6, "respostaSelecionada": "d"},
        {"questionNumber": 7, "respostaSelecionada": "c"},
        {"questionNumber": 8, "respostaSelecionada": "b"},
        {"questionNumber": 9, "respostaSelecionada": "a"},
        {"questionNumber": 10, "respostaSelecionada": "d"}
      ]
    },
    {
      "alunoId": "aluno_03",
      "archetype": "Alto Desempenho",
      "respostas": [
        {"questionNumber": 1, "respostaSelecionada": "c"},
        {"questionNumber": 2, "respostaSelecionada": "c"},
        {"questionNumber": 3, "respostaSelecionada": "b"},
        {"questionNumber": 4, "respostaSelecionada": "b"},
        {"questionNumber": 5, "respostaSelecionada": "b"},
        {"questionNumber": 6, "respostaSelecionada": "d"},
        {"questionNumber": 7, "respostaSelecionada": "c"},
        {"questionNumber": 8, "respostaSelecionada": "b"},
        {"questionNumber": 9, "respostaSelecionada": "a"},
        {"questionNumber": 10, "respostaSelecionada": "b"}
      ]
    },
    {
      "alunoId": "aluno_04",
      "archetype": "Alto Desempenho",
      "respostas": [
        {"questionNumber": 1, "respostaSelecionada": "c"},
        {"questionNumber": 2, "respostaSelecionada": "c"},
        {"questionNumber": 3, "respostaSelecionada": "b"},
        {"questionNumber": 4, "respostaSelecionada": "b"},
        {"questionNumber": 5, "respostaSelecionada": "b"},
        {"questionNumber": 6, "respostaSelecionada": "d"},
        {"questionNumber": 7, "respostaSelecionada": "c"},
        {"questionNumber": 8, "respostaSelecionada": "b"},
        {"questionNumber": 9, "respostaSelecionada": "a"},
        {"questionNumber": 10, "respostaSelecionada": "b"}
      ]
    },
    {
      "alunoId": "aluno_05",
      "archetype": "Mediano/Bom",
      "respostas": [
        {"questionNumber": 1, "respostaSelecionada": "c"},
        {"questionNumber": 2, "respostaSelecionada": "c"},
        {"questionNumber": 3, "respostaSelecionada": "b"},
        {"questionNumber": 4, "respostaSelecionada": "b"},
        {"questionNumber": 5, "respostaSelecionada": "b"},
        {"questionNumber": 6, "respostaSelecionada": "c"},
        {"questionNumber": 7, "respostaSelecionada": "a"},
        {"questionNumber": 8, "respostaSelecionada": "b"},
        {"questionNumber": 9, "respostaSelecionada": "a"},
        {"questionNumber": 10, "respostaSelecionada": "d"}
      ]
    },
    {
      "alunoId": "aluno_06",
      "archetype": "Mediano/Bom",
      "respostas": [
        {"questionNumber": 1, "respostaSelecionada": "c"},
        {"questionNumber": 2, "respostaSelecionada": "c"},
        {"questionNumber": 3, "respostaSelecionada": "b"},
        {"questionNumber": 4, "respostaSelecionada": "b"},
        {"questionNumber": 5, "respostaSelecionada": "b"},
        {"questionNumber": 6, "respostaSelecionada": "d"},
        {"questionNumber": 7, "respostaSelecionada": "c"},
        {"questionNumber": 8, "respostaSelecionada": "b"},
        {"questionNumber": 9, "respostaSelecionada": "b"},
        {"questionNumber": 10, "respostaSelecionada": "a"}
      ]
    },
    {
      "alunoId": "aluno_07",
      "archetype": "Mediano/Bom",
      "respostas": [
        {"questionNumber": 1, "respostaSelecionada": "c"},
        {"questionNumber": 2, "respostaSelecionada": "c"},
        {"questionNumber": 3, "respostaSelecionada": "b"},
        {"questionNumber": 4, "respostaSelecionada": "b"},
        {"questionNumber": 5, "respostaSelecionada": "d"},
        {"questionNumber": 6, "respostaSelecionada": "a"},
        {"questionNumber": 7, "respostaSelecionada": "c"},
        {"questionNumber": 8, "respostaSelecionada": "b"},
        {"questionNumber": 9, "respostaSelecionada": "a"},
        {"questionNumber": 10, "respostaSelecionada": "b"}
      ]
    },
    {
      "alunoId": "aluno_08",
      "archetype": "Mediano/Bom",
      "respostas": [
        {"questionNumber": 1, "respostaSelecionada": "c"},
        {"questionNumber": 2, "respostaSelecionada": "c"},
        {"questionNumber": 3, "respostaSelecionada": "b"},
        {"questionNumber": 4, "respostaSelecionada": "b"},
        {"questionNumber": 5, "respostaSelecionada": "b"},
        {"questionNumber": 6, "respostaSelecionada": "d"},
        {"questionNumber": 7, "respostaSelecionada": "c"},
        {"questionNumber": 8, "respostaSelecionada": "b"},
        {"questionNumber": 9, "respostaSelecionada": "a"},
        {"questionNumber": 10, "respostaSelecionada": "d"}
      ]
    },
    {
      "alunoId": "aluno_09",
      "archetype": "Mediano/Bom",
      "respostas": [
        {"questionNumber": 1, "respostaSelecionada": "c"},
        {"questionNumber": 2, "respostaSelecionada": "c"},
        {"questionNumber": 3, "respostaSelecionada": "b"},
        {"questionNumber": 4, "respostaSelecionada": "b"},
        {"questionNumber": 5, "respostaSelecionada": "b"},
        {"questionNumber": 6, "respostaSelecionada": "d"},
        {"questionNumber": 7, "respostaSelecionada": "c"},
        {"questionNumber": 8, "respostaSelecionada": "b"},
        {"questionNumber": 9, "respostaSelecionada": "c"},
        {"questionNumber": 10, "respostaSelecionada": "a"}
      ]
    },
    {
      "alunoId": "aluno_10",
      "archetype": "Mediano/Bom",
      "respostas": [
        {"questionNumber": 1, "respostaSelecionada": "c"},
        {"questionNumber": 2, "respostaSelecionada": "d"},
        {"questionNumber": 3, "respostaSelecionada": "b"},
        {"questionNumber": 4, "respostaSelecionada": "b"},
        {"questionNumber": 5, "respostaSelecionada": "b"},
        {"questionNumber": 6, "respostaSelecionada": "d"},
        {"questionNumber": 7, "respostaSelecionada": "c"},
        {"questionNumber": 8, "respostaSelecionada": "b"},
        {"questionNumber": 9, "respostaSelecionada": "a"},
        {"questionNumber": 10, "respostaSelecionada": "c"}
      ]
    },
    {
      "alunoId": "aluno_11",
      "archetype": "Mediano/Bom",
      "respostas": [
        {"questionNumber": 1, "respostaSelecionada": "c"},
        {"questionNumber": 2, "respostaSelecionada": "c"},
        {"questionNumber": 3, "respostaSelecionada": "b"},
        {"questionNumber": 4, "respostaSelecionada": "a"},
        {"questionNumber": 5, "respostaSelecionada": "b"},
        {"questionNumber": 6, "respostaSelecionada": "b"},
        {"questionNumber": 7, "respostaSelecionada": "c"},
        {"questionNumber": 8, "respostaSelecionada": "b"},
        {"questionNumber": 9, "respostaSelecionada": "a"},
        {"questionNumber": 10, "respostaSelecionada": "b"}
      ]
    },
    {
      "alunoId": "aluno_12",
      "archetype": "Mediano/Bom",
      "respostas": [
        {"questionNumber": 1, "respostaSelecionada": "c"},
        {"questionNumber": 2, "respostaSelecionada": "c"},
        {"questionNumber": 3, "respostaSelecionada": "a"},
        {"questionNumber": 4, "respostaSelecionada": "b"},
        {"questionNumber": 5, "respostaSelecionada": "b"},
        {"questionNumber": 6, "respostaSelecionada": "d"},
        {"questionNumber": 7, "respostaSelecionada": "c"},
        {"questionNumber": 8, "respostaSelecionada": "b"},
        {"questionNumber": 9, "respostaSelecionada": "a"},
        {"questionNumber": 10, "respostaSelecionada": "d"}
      ]
    },
    {
      "alunoId": "aluno_13",
      "archetype": "Mediano/Bom",
      "respostas": [
        {"questionNumber": 1, "respostaSelecionada": "c"},
        {"questionNumber": 2, "respostaSelecionada": "c"},
        {"questionNumber": 3, "respostaSelecionada": "b"},
        {"questionNumber": 4, "respostaSelecionada": "b"},
        {"questionNumber": 5, "respostaSelecionada": "b"},
        {"questionNumber": 6, "respostaSelecionada": "d"},
        {"questionNumber": 7, "respostaSelecionada": "c"},
        {"questionNumber": 8, "respostaSelecionada": "b"},
        {"questionNumber": 9, "respostaSelecionada": "a"},
        {"questionNumber": 10, "respostaSelecionada": "b"}
      ]
    },
    {
      "alunoId": "aluno_14",
      "archetype": "Mediano/Bom",
      "respostas": [
        {"questionNumber": 1, "respostaSelecionada": "d"},
        {"questionNumber": 2, "respostaSelecionada": "c"},
        {"questionNumber": 3, "respostaSelecionada": "b"},
        {"questionNumber": 4, "respostaSelecionada": "b"},
        {"questionNumber": 5, "respostaSelecionada": "b"},
        {"questionNumber": 6, "respostaSelecionada": "a"},
        {"questionNumber": 7, "respostaSelecionada": "c"},
        {"questionNumber": 8, "respostaSelecionada": "b"},
        {"questionNumber": 9, "respostaSelecionada": "a"},
        {"questionNumber": 10, "respostaSelecionada": "b"}
      ]
    },
    {
      "alunoId": "aluno_15",
      "archetype": "Com Dificuldades",
      "respostas": [
        {"questionNumber": 1, "respostaSelecionada": "a"},
        {"questionNumber": 2, "respostaSelecionada": "d"},
        {"questionNumber": 3, "respostaSelecionada": "a"},
        {"questionNumber": 4, "respostaSelecionada": "c"},
        {"questionNumber": 5, "respostaSelecionada": "d"},
        {"questionNumber": 6, "respostaSelecionada": "c"},
        {"questionNumber": 7, "respostaSelecionada": "a"},
        {"questionNumber": 8, "respostaSelecionada": "b"},
        {"questionNumber": 9, "respostaSelecionada": "c"},
        {"questionNumber": 10, "respostaSelecionada": "a"}
      ]
    },
    {
      "alunoId": "aluno_16",
      "archetype": "Com Dificuldades",
      "respostas": [
        {"questionNumber": 1, "respostaSelecionada": "c"},
        {"questionNumber": 2, "respostaSelecionada": "c"},
        {"questionNumber": 3, "respostaSelecionada": "d"},
        {"questionNumber": 4, "respostaSelecionada": "a"},
        {"questionNumber": 5, "respostaSelecionada": "a"},
        {"questionNumber": 6, "respostaSelecionada": "b"},
        {"questionNumber": 7, "respostaSelecionada": "c"},
        {"questionNumber": 8, "respostaSelecionada": "d"},
        {"questionNumber": 9, "respostaSelecionada": "d"},
        {"questionNumber": 10, "respostaSelecionada": "c"}
      ]
    },
    {
      "alunoId": "aluno_17",
      "archetype": "Com Dificuldades",
      "respostas": [
        {"questionNumber": 1, "respostaSelecionada": "d"},
        {"questionNumber": 2, "respostaSelecionada": "a"},
        {"questionNumber": 3, "respostaSelecionada": "b"},
        {"questionNumber": 4, "respostaSelecionada": "b"},
        {"questionNumber": 5, "respostaSelecionada": "c"},
        {"questionNumber": 6, "respostaSelecionada": "a"},
        {"questionNumber": 7, "respostaSelecionada": "b"},
        {"questionNumber": 8, "respostaSelecionada": "c"},
        {"questionNumber": 9, "respostaSelecionada": "b"},
        {"questionNumber": 10, "respostaSelecionada": "a"}
      ]
    },
    {
      "alunoId": "aluno_18",
      "archetype": "Com Dificuldades",
      "respostas": [
        {"questionNumber": 1, "respostaSelecionada": "b"},
        {"questionNumber": 2, "respostaSelecionada": "c"},
        {"questionNumber": 3, "respostaSelecionada": "c"},
        {"questionNumber": 4, "respostaSelecionada": "d"},
        {"questionNumber": 5, "respostaSelecionada": "b"},
        {"questionNumber": 6, "respostaSelecionada": "c"},
        {"questionNumber": 7, "respostaSelecionada": "d"},
        {"questionNumber": 8, "respostaSelecionada": "a"},
        {"questionNumber": 9, "respostaSelecionada": "c"},
        {"questionNumber": 10, "respostaSelecionada": "d"}
      ]
    },
    {
      "alunoId": "aluno_19",
      "archetype": "Inconsistente",
      "respostas": [
        {"questionNumber": 1, "respostaSelecionada": "c"},
        {"questionNumber": 2, "respostaSelecionada": "a"},
        {"questionNumber": 3, "respostaSelecionada": "b"},
        {"questionNumber": 4, "respostaSelecionada": "d"},
        {"questionNumber": 5, "respostaSelecionada": "b"},
        {"questionNumber": 6, "respostaSelecionada": "a"},
        {"questionNumber": 7, "respostaSelecionada": "b"},
        {"questionNumber": 8, "respostaSelecionada": "b"},
        {"questionNumber": 9, "respostaSelecionada": "d"},
        {"questionNumber": 10, "respostaSelecionada": "b"}
      ]
    },
    {
      "alunoId": "aluno_20",
      "archetype": "Inconsistente",
      "respostas": [
        {"questionNumber": 1, "respostaSelecionada": "a"},
        {"questionNumber": 2, "respostaSelecionada": "c"},
        {"questionNumber": 3, "respostaSelecionada": "b"},
        {"questionNumber": 4, "respostaSelecionada": "b"},
        {"questionNumber": 5, "respostaSelecionada": "c"},
        {"questionNumber": 6, "respostaSelecionada": "d"},
        {"questionNumber": 7, "respostaSelecionada": "a"},
        {"questionNumber": 8, "respostaSelecionada": "c"},
        {"questionNumber": 9, "respostaSelecionada": "b"},
        {"questionNumber": 10, "respostaSelecionada": "a"}
      ]
    }
  ]
}
```

### 3\. Próximos Passos: Como Utilizar Estes Dados

Este conjunto de dados sintético é agora o seu "laboratório". O próximo passo é usá-lo para testar o *back-end* e a lógica de IA da sua plataforma.

1.  **Teste do Módulo de Diagnóstico:**

      * Crie um script que itere sobre este JSON. Para cada resposta incorreta, ele deve extrair os dados relevantes (`questão original`, `resposta do aluno`, `resposta correta`, `racional do distrator`, e o `vetor histórico` simulado do arquétipo).
      * Submeta estes dados ao seu **"Prompt de Diagnóstico Causal do Erro" (P-3.2)**, aquele que usa o modelo `pro`.
      * Armazene as "diretivas" de intervenção geradas pela IA.

2.  **Teste do Módulo de Relatórios:**

      * Após processar todas as respostas, agregue os resultados por aluno e para a turma toda (percentagem de acertos por questão, por nível de Bloom, etc.).
      * Utilize estes dados agregados como input para o seu **"Prompt de Geração de Relatórios" (P-5.1)**.
      * Gere um relatório para um aluno de "Alto Desempenho", um "Mediano" e um "Com Dificuldades".

3.  **Validação das Hipóteses:**

      * **Análise Qualitativa:** Leia os diagnósticos e relatórios gerados pela IA. Eles são consistentes com a "verdade fundamental" do arquétipo do aluno?
          * *Exemplo:* Para o `aluno_15` (Com Dificuldades), o relatório da IA deve identificar um padrão de erro em questões de múltiplos níveis, não apenas nas de Análise. Para o `aluno_05` (Mediano/Bom), o diagnóstico deve focar-se nas dificuldades com as questões de Aplicação/Análise (Q6, Q7, Q10).
      * **Análise Quantitativa:** Verifique se as diretivas de intervenção geradas são apropriadas. Se um aluno errou uma questão de "Aplicação", a diretiva gerada propõe a criação de novas questões de "Aplicação" ou de um nível inferior ("Compreensão") para reforçar a base?

Este conjunto de dados permite-lhe testar e refinar o ciclo completo da sua plataforma, desde a avaliação até ao diagnóstico e à recomendação, antes mesmo de ter o seu primeiro utilizador real.