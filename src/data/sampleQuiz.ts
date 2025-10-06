/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import { QuizData } from "@/types";

export const sampleQuizData: QuizData = {
  title: "Avaliação Diagnóstica - Cardiologia",
  description: "Um quiz para testar o conhecimento sobre os artigos de cardiologia fornecidos.",
  questions: [
    {
      "questionNumber": 1,
      "question": "De acordo com o estudo de Ahmed et al., qual é a conclusão principal sobre o uso de inibidores da ECA (IECA) ou bloqueadores dos receptores da angiotensina (BRA) em pacientes idosos com insuficiência cardíaca diastólica (ICD)?",
      "answerOptions": [
        { "text": "Reduzem significativamente as hospitalizações por insuficiência cardíaca em todos os pacientes com ICD.", "rationale": "O estudo não encontrou uma associação significativa entre o uso destes medicamentos e a redução de hospitalizações especificamente por insuficiência cardíaca.", "isCorrect": false },
        { "text": "Aumentam o risco de mortalidade em pacientes com doença renal crónica (DRC) devido a efeitos adversos renais.", "rationale": "Pelo contrário, o estudo sugere que os medicamentos são seguros e benéficos neste subgrupo, apesar das preocupações teóricas sobre a função renal.", "isCorrect": false },
        { "text": "Estão associados a uma redução significativa da mortalidade por todas as causas em pacientes com ICD e DRC concomitante.", "rationale": "Este é o principal achado do estudo, demonstrando um benefício de sobrevida (HR de 0.82) neste subgrupo específico, um efeito que não foi observado em pacientes sem DRC.", "isCorrect": true },
        { "text": "O seu benefício é universal, aplicando-se igualmente a pacientes com e sem doença renal crónica.", "rationale": "O estudo destaca uma heterogeneidade de efeito, onde o benefício de mortalidade foi observado no grupo com DRC, mas não no grupo sem DRC.", "isCorrect": false }
      ],
      "hint": "Considere como a presença de doença renal crónica (DRC) modifica o efeito da terapia."
    },
    {
      "questionNumber": 2,
      "question": "O artigo \"Novel Drug Targets in Diastolic Heart Disease\" propõe um \"ciclo de feedback mal-adaptativo\" na fisiopatologia da HFpEF. Qual componente é descrito como a ligação mecânica e de sinalização entre a matriz extracelular (MEC) e o sarcómero?",
      "answerOptions": [
        { "text": "As mitocôndrias.", "rationale": "As mitocôndrias são cruciais para a energética celular e estão envolvidas no ciclo, mas não são a principal ligação estrutural entre a MEC e o sarcómero.", "isCorrect": false },
        { "text": "O canal de cálcio tipo L.", "rationale": "O canal de cálcio tipo L é vital para a excitação-contração, mas o costâmero é o complexo proteico que serve de ponte estrutural.", "isCorrect": false },
        { "text": "O costâmero (complexo de integrinas e proteínas adaptadoras).", "rationale": "O artigo define o costâmero como o complexo de proteínas que transmite sinais bidirecionalmente entre a MEC e o citoesqueleto, sendo um alvo terapêutico chave para interromper o ciclo.", "isCorrect": true },
        { "text": "A proteína titina.", "rationale": "A titina é a principal responsável pela rigidez passiva dentro do sarcómero, mas não é a estrutura que liga o sarcómero à MEC.", "isCorrect": false }
      ],
      "hint": "Pense na estrutura que fisicamente atravessa a membrana celular para conectar o exterior com o interior do miócito."
    },
    {
      "questionNumber": 3,
      "question": "Segundo o consenso da Sociedade Europeia de Cardiologia sobre vacinação, qual é a principal razão pela qual infecções como a influenza aumentam o risco de eventos cardiovasculares adversos maiores (MACE)?",
      "answerOptions": [
        { "text": "Pela infecção viral direta e replicação no miocárdio, causando dano celular imediato.", "rationale": "Embora a infecção direta possa ocorrer, o consenso enfatiza que os efeitos indiretos via inflamação sistémica são os mecanismos mais estabelecidos e significativos.", "isCorrect": false },
        { "text": "Pela indução de uma resposta inflamatória e pró-trombótica sistémica que pode desestabilizar placas ateroscleróticas.", "rationale": "Este é o mecanismo central descrito, onde a \"tempestade de citocinas\" e a ativação de vias de coagulação, desencadeadas pela infecção, levam a eventos isquémicos agudos.", "isCorrect": true },
        { "text": "Pelo aumento da pressão arterial durante a febre, levando a uma sobrecarga de pressão no ventrículo esquerdo.", "rationale": "Embora a febre possa aumentar a frequência cardíaca, a desestabilização de placas ateroscleróticas através de mecanismos inflamatórios é o principal fator de risco para MACE.", "isCorrect": false },
        { "text": "Pela competição do vírus com o oxigénio na hemoglobina, causando hipoxia miocárdica.", "rationale": "Este não é um mecanismo fisiopatológico descrito para o aumento do risco de MACE relacionado com infecções virais.", "isCorrect": false }
      ],
      "hint": "Foque-se nos efeitos sistémicos da infecção, em vez de um efeito localizado no coração."
    },
    {
      "questionNumber": 4,
      "question": "O estudo sobre a terapia com estatinas na insuficiência cardíaca diastólica (Tehrani et al.) encontrou um benefício de sobrevida significativo, que os autores sugerem ser desproporcional à redução de LDL. Qual dos seguintes é um efeito pleiotrópico das estatinas mencionado como um possível mecanismo para este benefício?",
      "answerOptions": [
        { "text": "Aumento da contratilidade do miocárdio (efeito inotrópico positivo).", "rationale": "As estatinas não são conhecidas por terem um efeito inotrópico direto; os seus benefícios estão mais relacionados com a inflamação e a função vascular.", "isCorrect": false },
        { "text": "Melhora da função endotelial através do aumento da produção de óxido nítrico sintase.", "rationale": "Este é um dos principais efeitos pleiotrópicos citados, que melhora a vasodilatação microvascular e pode ser particularmente benéfico na HFpEF, onde a disfunção endotelial é comum.", "isCorrect": true },
        { "text": "Redução direta da fibrose miocárdica através da inibição do TGF-β.", "rationale": "Embora possam atenuar o remodelamento, a inibição direta do TGF-β não é o principal mecanismo pleiotrópico atribuído às estatinas no artigo.", "isCorrect": false },
        { "text": "Aumento da sensibilidade dos miofilamentos ao cálcio.", "rationale": "Este mecanismo está mais associado a outras classes de medicamentos, como os sensibilizadores de cálcio, e não é um efeito pleiotrópico conhecido das estatinas.", "isCorrect": false }
      ],
      "hint": "Considere os efeitos das estatinas para além dos lípidos, especificamente na parede dos vasos sanguíneos."
    },
    {
      "questionNumber": 5,
      "question": "Um paciente com cardiomiopatia hipertrófica apresenta hipercontratilidade do sarcómero. Com base no artigo \"Novel Drug Targets\", qual classe de medicamento, como o mavacamten, seria a mais indicada para tratar este mecanismo específico?",
      "answerOptions": [
        { "text": "Ativadores da SIRT3.", "rationale": "Os ativadores da SIRT3, como o honokiol, visam a disfunção mitocondrial e a hiperacetilação de proteínas, não a hipercontratilidade do sarcómero diretamente.", "isCorrect": false },
        { "text": "Inibidores da miosina cardíaca.", "rationale": "O artigo especifica que o mavacamten é um inibidor da miosina que reduz a hipercontratilidade ao limitar a capacidade da cabeça da miosina de se ligar à actina, sendo a terapia direcionada para este mecanismo.", "isCorrect": true },
        { "text": "Antagonistas dos canais PIEZO1.", "rationale": "Os antagonistas dos canais PIEZO1 visam a mecanotransdução e as vias de sinalização hipertróficas, mas não atuam diretamente na mecânica do sarcómero.", "isCorrect": false },
        { "text": "Inibidores da ECA.", "rationale": "Os inibidores da ECA atuam no sistema renina-angiotensina para reduzir a pré-carga e a pós-carga, influenciando o remodelamento, mas não modulam diretamente a contratilidade do sarcómero.", "isCorrect": false }
      ],
      "hint": "O nome da classe de medicamento muitas vezes descreve a proteína do sarcómero que ele tem como alvo."
    }
  ]
};