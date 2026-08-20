# Ajuste de altura do card da Vitrine Digital

## Objetivo
Aumentar a altura do card de criador na Vitrine Digital para que o rosto da pessoa não fique cortado pela sobreposição de conteúdo na parte inferior.

## Alterações propostas

### 1. Aumentar a proporção da área de foto
No componente `src/components/ProfileCard.tsx`, alterar a proporção da área de foto de `aspect-[7/10]` para uma proporção mais alta (mais "vertical"), como `aspect-[2/3]` ou `aspect-[3/4]`.

A proporção exata será definida após teste visual rápido; o ponto de partida sugerido é `aspect-[2/3]`, que aumenta a altura da foto em cerca de 4,7% em relação ao `7/10` atual.

### 2. Revisar o posicionamento da imagem
Avaliar se o `object-position` da imagem (`object-[center_top]`) continua adequado. Se o rosto continuar cortado na parte inferior mesmo com o card maior, testar `object-center` ou `object-[center_30%]` para garantir que o rosto fique visível entre os badges superiores e a overlay inferior.

### 3. Manter a consistência visual
- Preservar o hover `scale-[1.03]` já aplicado.
- Preservar os badges de seguidores, tier, nichos, nome e ícones de rede.
- Garantir que a overlay de conteúdo continue alinhada na parte inferior do card.

## Critério de aceitação
O rosto do criador deve aparecer completo (testa, olhos, nariz e queixo) no card da vitrine, sem cortes causados pela overlay de conteúdo.

## Notas técnicas
- Componente afetado: `src/components/ProfileCard.tsx`.
- A alteração é apenas de CSS/JSX; não envolve backend, banco de dados ou novas dependências.
- Após ajuste, validar via build e visualização rápida na rota `/vitrine`.
