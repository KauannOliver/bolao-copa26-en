import React from 'react';
import { BookOpen } from 'lucide-react';

export const Regras: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in-up pb-20 max-w-4xl">
      <div>
        <h1 className="heading-1 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-primary" />
          Regras do Bolão da Copa
        </h1>
        <p className="text-muted-foreground">O Bolão será dividido em duas etapas: Fase de Grupos e Mata-Mata.</p>
      </div>

      <div className="glass-card p-6 space-y-6">
        <section>
          <h2 className="heading-2">1ª Etapa — Fase de Grupos</h2>
          <p className="text-white/80 mb-4">
            Na primeira etapa, cada participante deverá indicar os 3 primeiros colocados de cada grupo, informando a ordem exata de classificação.
          </p>
          
          <div className="bg-white/5 p-4 rounded-lg border border-white/10 mb-6">
            <h3 className="font-bold text-primary mb-2">Pontuação da 1ª Etapa</h3>
            <ul className="list-disc list-inside text-white/80 space-y-2">
              <li><strong>3 pontos:</strong> Acertar o país e sua posição correta no grupo.</li>
              <li><strong>1 ponto:</strong> Acertar apenas o país entre os 3 primeiros colocados, mas em posição diferente da indicada.</li>
            </ul>
          </div>

          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
            <h3 className="font-bold text-success mb-2">Premiação da 1ª Etapa</h3>
            <p className="text-white/80 mb-2">
              Ao final da primeira fase, será destinada metade do valor total arrecadado para premiação dos três primeiros colocados desta etapa.
            </p>
            <ul className="list-disc list-inside text-white/80 space-y-1">
              <li><strong>1º colocado:</strong> 60% do valor destinado à 1ª etapa;</li>
              <li><strong>2º colocado:</strong> 30% do valor destinado à 1ª etapa;</li>
              <li><strong>3º colocado:</strong> 10% do valor destinado à 1ª etapa.</li>
            </ul>
          </div>
        </section>

        <hr className="border-white/10" />

        <section>
          <h2 className="heading-2">2ª Etapa — Mata-Mata</h2>
          <p className="text-white/80 mb-4">
            Na segunda etapa (mata-mata da Copa), cada participante deverá preencher o resultado de cada jogo antes do início da partida.
          </p>

          <div className="bg-white/5 p-4 rounded-lg border border-white/10 mb-6 space-y-4">
            <h3 className="font-bold text-primary mb-2">Pontuação da 2ª Etapa</h3>
            
            <div>
              <p className="font-bold text-white">Placar exato: 10 pontos</p>
              <p className="text-sm text-white/60">Quando o participante acertar exatamente o placar da partida. Ex: palpite 1x0 e placar final 1x0.</p>
            </div>
            
            <div>
              <p className="font-bold text-white">Vencedor + saldo de gols: 6 pontos</p>
              <p className="text-sm text-white/60">Quando acertar o vencedor da partida e também o saldo de gols. Ex: palpite 1x0 e placar final 2x1.</p>
            </div>
            
            <div>
              <p className="font-bold text-white">Vencedor + gols do vencedor: 5 pontos</p>
              <p className="text-sm text-white/60">Quando acertar o vencedor da partida e a quantidade de gols marcados por ele. Ex: palpite 2x1 e placar final 2x0.</p>
            </div>

            <div>
              <p className="font-bold text-white">Empate não exato: 5 pontos</p>
              <p className="text-sm text-white/60">Quando acertar que a partida terminaria empatada, mas errar o placar exato. Ex: palpite 1x1 e placar final 2x2.</p>
            </div>

            <div>
              <p className="font-bold text-white">Apenas vencedor: 4 pontos</p>
              <p className="text-sm text-white/60">Quando acertar somente o vencedor da partida. Ex: palpite 1x0 e placar final 2x0.</p>
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
            <h3 className="font-bold text-success mb-2">Premiação da 2ª Etapa</h3>
            <p className="text-white/80 mb-2">
              Ao final do mata-mata, será destinada a outra metade do valor total arrecadado para os três primeiros colocados desta etapa.
            </p>
            <ul className="list-disc list-inside text-white/80 space-y-1">
              <li><strong>1º colocado:</strong> 60% do valor destinado à 2ª etapa;</li>
              <li><strong>2º colocado:</strong> 30% do valor destinado à 2ª etapa;</li>
              <li><strong>3º colocado:</strong> 10% do valor destinado à 2ª etapa.</li>
            </ul>
          </div>
        </section>

        <hr className="border-white/10" />

        <section className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
          <h2 className="heading-3 !mb-2">Observações Gerais</h2>
          <ul className="list-disc list-inside text-white/80 space-y-2">
            <li>Os palpites da 2ª etapa deverão ser registrados <strong>antes do início</strong> de cada jogo.</li>
            <li>A pontuação da 2ª etapa considera o placar final da partida, incluindo eventual tempo extra, conforme regra da organização.</li>
            <li>Em caso de empate na classificação final de qualquer etapa, o valor correspondente à colocação empatada será dividido igualmente entre o número de ganhadores daquela posição.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};
