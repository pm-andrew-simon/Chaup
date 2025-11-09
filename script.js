        // === МОБИЛЬНОЕ МЕНЮ ===
        function toggleMobileMenu() {
            const navLinks = document.querySelector('.nav-links');
            const hamburger = document.querySelector('.hamburger');

            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        }

        // Обработчик клика на гамбургер
        document.addEventListener('DOMContentLoaded', function() {
            const hamburger = document.querySelector('.hamburger');
            const navLinks = document.querySelector('.nav-links');
            const navLinksItems = document.querySelectorAll('.nav-links a');

            if (hamburger) {
                hamburger.addEventListener('click', toggleMobileMenu);
            }

            // Закрываем меню при клике на ссылку
            navLinksItems.forEach(link => {
                link.addEventListener('click', function() {
                    if (window.innerWidth <= 768 && navLinks.classList.contains('active')) {
                        toggleMobileMenu();
                    }
                });
            });
        });
		
        // === Общие функции ===	
		
		function createDiceFace(value) {
            const faceClasses = ['', 'one', 'two', 'three', 'four', 'five', 'six'];
            const dotCounts = [0, 1, 2, 3, 4, 5, 6];

            let html = '';
            for (let i = 0; i < dotCounts[value]; i++) {
                html += '<div class="dice-dot"></div>';
            }

            return {
                html: html,
                className: faceClasses[value]
            };
        }
		
		// ================================
        // ФУНКЦИИ КООРДИНАТ И ПОЗИЦИОНИРОВАНИЯ
        // ================================
		
        function coordToPosition(coord) {
            const col = coord.charCodeAt(0) - 65; // A=0, B=1, ..., O=14
            const row = parseInt(coord.substring(1)) - 1; // 1=0, 2=1, ..., 15=14
            
            let boardSize;
            if (window.innerWidth <= 768) {
                // На мобильных устройствах используем полную ширину экрана
                boardSize = window.innerWidth;
            } else {
                // На десктопе ограничиваем размер
                boardSize = Math.min(window.innerWidth * 0.9, 600);
            }

            let cellSize;
            if (window.innerWidth <= 768) {
                // На мобильных устройствах делаем клетки ровно 1/15 от размера поля
                cellSize = (boardSize-20) / 15;
            } else {
                // На десктопе используем оригинальную пропорцию
                cellSize = boardSize * 35 / 600;
            }

            // Рассчитываем отступ так, чтобы сетка 15x15 была точно по центру
            // Общая ширина/высота игрового поля: 15 * cellSize
            const gameFieldSize = 15 * cellSize;
            const offset = (boardSize - gameFieldSize) / 2;
            
            return {
                x: col * cellSize + offset,
                y: row * cellSize + offset
            };
        }
		function positionToCoord(x, y) {
            let boardSize;
            if (window.innerWidth <= 768) {
                boardSize = window.innerWidth;
            } else {
                boardSize = Math.min(window.innerWidth * 0.9, 600);
            }

            let cellSize;
            if (window.innerWidth <= 768) {
                // На мобильных устройствах делаем клетки ровно 1/15 от размера поля
                cellSize = boardSize / 15;
            } else {
                // На десктопе используем оригинальную пропорцию
                cellSize = boardSize * 35 / 600;
            }

            // Используем тот же расчет отступа, что и в coordToPosition
            const gameFieldSize = 15 * cellSize;
            const offset = (boardSize - gameFieldSize) / 2;
            
            const col = Math.floor((x - offset) / cellSize);
            const row = Math.floor((y - offset) / cellSize);
            if (col < 0 || col > 14 || row < 0 || row > 14) return null;
            return String.fromCharCode(65 + col) + (row + 1);
        }
        function calculateDiceAreaPosition(area) {
            const fromPos = coordToPosition(area.from);
            const toPos = coordToPosition(area.to);

            if (!fromPos || !toPos) return null;

            // Центр области
            const centerX = (fromPos.x + toPos.x) / 2;
            const centerY = (fromPos.y + toPos.y) / 2;

            return { centerX, centerY };
        }
        // Функция для создания кубиков игрока
		function createPlayerDice() {
            const board = document.getElementById('game-board');
            if (!board) return;

            // Удаляем существующие кубики игроков
            document.querySelectorAll('.player-dice').forEach(dice => dice.remove());

            // Создаем кубики только для активных игроков
            for (let player = 1; player <= playerCount; player++) {
                const area = DICE_AREAS[player];
                const areaPos = calculateDiceAreaPosition(area);

                if (!areaPos) continue;

                // Создаем два кубика для игрока
                for (let diceIndex = 0; diceIndex < 2; diceIndex++) {
                    const dice = document.createElement('div');
                    dice.className = 'player-dice inactive';
                    dice.id = `player-dice-${player}-${diceIndex + 1}`;
                    dice.dataset.player = player;
                    dice.dataset.diceIndex = diceIndex;

                    // Создаем dice-face внутри
                    const face = document.createElement('div');
                    face.className = 'dice-face';
                    face.textContent = '?';
                    dice.appendChild(face);

                    // Позиционируем кубики рядом друг с другом
                    const diceSize = Math.min(90 * window.innerWidth / 100, 600) * 37.5 / 600; // Размер из CSS
                    const spacing = 8; // Увеличенное расстояние между кубиками
                    const offsetX = diceIndex === 0 ? -diceSize/2 - spacing/2 : diceSize/2 + spacing/2;

                    dice.style.left = (areaPos.centerX + offsetX) + 'px';
                    dice.style.top = (areaPos.centerY - diceSize/2) + 'px';

                    // Добавляем обработчик клика (с проверкой на существование функции)
                    dice.addEventListener('click', () => {
                        if (typeof handlePlayerDiceClick === 'function') {
                            handlePlayerDiceClick(player);
                        }
                    });

                    board.appendChild(dice);
                }
            }
        }

		function updatePlayerDiceStates() {
            // Обновляем визуальное состояние кубиков для всех игроков
            for (let player = 1; player <= 4; player++) {
                const dice1 = document.getElementById(`player-dice-${player}-1`);
                const dice2 = document.getElementById(`player-dice-${player}-2`);

                if (dice1 && dice2) {
                    const isActive = player === currentPlayer;
                    const className = isActive ? 'player-dice active' : 'player-dice inactive';

                    dice1.className = className;
                    dice2.className = className;

                    // Отображаем значения кубиков
                    const values = playerDiceValues[player];
                    updatePlayerDiceFace(dice1, values[0]);
                    updatePlayerDiceFace(dice2, values[1]);
                }
            }
        }		

		function updatePlayerDiceFace(diceElement, value) {
            const faceElement = diceElement.querySelector('.dice-face');
            if (value === 0) {
                faceElement.textContent = '?';
                faceElement.className = 'dice-face';
            } else {
                const faceData = createDiceFace(value);
                faceElement.className = 'dice-face ' + faceData.className;
                faceElement.innerHTML = faceData.html;
            }
        }
		
		function createDirectionArrows() {
            const board = document.getElementById('game-board');
            if (!board) return;
            
            const arrowSVG = `<svg id="_Слой_2" data-name="Слой 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080">
                <defs>
                    <style>
                        .cls-1, .cls-2 { fill: #809786; }
                        .cls-2 { stroke-miterlimit: 10; stroke-width: 40px; }
                        .cls-2, .cls-3 { stroke: #809786; }
                        .cls-3 { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-width: 50px; }
                    </style>
                </defs>
                <line class="cls-3" x1="540" y1="100" x2="540" y2="760"/>
                <path class="cls-2" d="M534.74,97.9l-143.42,238.02c-2.01,3.33.39,7.58,4.28,7.58h286.84c3.89,0,6.29-4.25,4.28-7.58l-143.42-238.02c-1.94-3.23-6.62-3.23-8.57,0Z"/>
                <circle class="cls-1" cx="540" cy="867.65" r="30"/>
            </svg>`;
            
            // Координаты и их поворот (в градусах)
            const arrows = [
                // 0 градусов (исходное положение)
                { coords: ['O12', 'O10', 'G15'], rotation: 0 },
                // 90 градусов
                { coords: ['D15', 'F15', 'A7'], rotation: 90 },
                // 180 градусов
                { coords: ['A4', 'A6', 'I1'], rotation: 180 },
                // 270 градусов
                { coords: ['L1', 'J1', 'O9'], rotation: 270 }
            ];
            
            arrows.forEach(arrowGroup => {
                arrowGroup.coords.forEach(coord => {
                    // Сначала попробуем найти ячейку среди существующих
                    let cell = board.querySelector(`[data-coord="${coord}"]`);
                    
                    // Если ячейка не найдена, создаем невидимый контейнер только для стрелки
                    if (!cell) {
                        cell = document.createElement('div');
                        cell.style.position = 'absolute';
                        cell.style.background = 'transparent';
                        cell.style.border = 'none';
                        cell.style.pointerEvents = 'none';
                        cell.dataset.coord = coord;
                        
                        const pos = coordToPosition(coord);
                        cell.style.left = pos.x + 'px';
                        cell.style.top = pos.y + 'px';
                        cell.style.width = 'calc(min(90vw, 600px) * 35 / 600)';
                        cell.style.height = 'calc(min(90vw, 600px) * 35 / 600)';
                        
                        board.appendChild(cell);
                    }
                    
                    if (cell) {
                        const arrowElement = document.createElement('div');
                        arrowElement.className = `direction-arrow arrow-${arrowGroup.rotation}`;
                        arrowElement.innerHTML = arrowSVG;
                        
                        cell.appendChild(arrowElement);
                    }
                });
            });
        }

        function createTemplesAndJails() {
            const board = document.getElementById('game-board');
            if (!board) return;
            
            const templeSVG = `<svg id="_Слой_2" data-name="Слой 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080">
                <defs>
                    <style>
                        .cls-1 { fill: #809786; }
                        .cls-2 { fill: none; stroke: #809786; stroke-linecap: round; stroke-linejoin: round; stroke-width: 50px; }
                    </style>
                </defs>
                <path class="cls-1" d="M674.31,653.29v220.38h-264.56v-220.38h264.56M696.09,631.51h-308.12v263.93h308.12v-263.93h0Z"/>
                <path class="cls-1" d="M366.19,633.74v239.92h-150.58v-239.92h150.58M387.97,611.97h-194.13v283.48h194.13v-283.48h0Z"/>
                <g>
                    <rect class="cls-1" x="217.57" y="561.25" width="145.7" height="43.45"/>
                    <path class="cls-1" d="M356.01,568.51v28.94h-131.18v-28.94h131.18M370.53,553.99h-160.22v57.97h160.22v-57.97h0Z"/>
                </g>
                <path class="cls-1" d="M868.45,633.74v239.92h-150.58v-239.92h150.58M890.23,611.97h-194.13v283.48h194.13v-283.48h0Z"/>
                <g>
                    <rect class="cls-1" x="719.82" y="561.25" width="145.7" height="43.45"/>
                    <path class="cls-1" d="M858.26,568.51v28.94h-131.18v-28.94h131.18M872.78,553.99h-160.22v57.97h160.22v-57.97h0Z"/>
                </g>
                <path class="cls-1" d="M674.31,557.52v52.21h-265.29v-52.21h265.29M696.09,535.74h-308.84v95.77h308.84v-95.77h0Z"/>
                <path class="cls-1" d="M548.41,686.42c30.85,0,55.95,25.1,55.95,55.95v130.1h-124.66v-130.1c0-30.85,25.1-55.95,55.95-55.95h12.75M548.41,664.64h-12.75c-42.93,0-77.73,34.8-77.73,77.73v151.88h168.21v-151.88c0-42.93-34.8-77.73-77.73-77.73h0Z"/>
                <path class="cls-1" d="M558.8,276.96h0,0M542.59,288.22c12.17,10.26,29.93,25.57,51.17,44.36,35.81,31.68,63.94,57.77,71.65,66.47,1.24,1.4,11.99,15.19,6.65,67.1-1.24,12.09-3.12,23.63-4.97,33.29h-251.12c-1.75-8.27-3.45-18.07-4.52-28.54-3.35-32.83.95-58.79,12.12-73.08,15.32-19.61,42.17-46.14,75.6-74.69,17.52-14.97,32.65-26.88,43.42-34.92M544.76,243.75c-7.55,0-107.79,77.99-149.78,131.74-42.6,54.52-7,160.26-7,160.26h308.12s33.11-119.46-3.52-160.77c-21.4-24.14-141.58-128.98-147.55-131.18-.07-.03-.16-.05-.27-.05h0Z"/>
                <line class="cls-2" x1="542.67" y1="184.56" x2="542.67" y2="253.2"/>
                <line class="cls-2" x1="157.71" y1="894.25" x2="922.29" y2="894.25"/>
            </svg>`;
            
            const jailSVG = `<svg id="_Слой_2" data-name="Слой 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080">
                <defs>
                    <style>
                        .cls-1 { stroke-width: 60px; }
                        .cls-1, .cls-2 { fill: none; stroke: #809786; stroke-linecap: round; stroke-linejoin: round; }
                        .cls-2 { stroke-width: 50px; }
                    </style>
                </defs>
                <line class="cls-1" x1="320" y1="100" x2="320" y2="947.48"/>
                <line class="cls-1" x1="760" y1="116.26" x2="760" y2="963.74"/>
                <line class="cls-2" x1="374.62" y1="265.38" x2="265.38" y2="374.62"/>
                <line class="cls-2" x1="814.62" y1="705.38" x2="705.38" y2="814.62"/>
                <line class="cls-2" x1="814.62" y1="366.49" x2="705.38" y2="257.25"/>
                <line class="cls-2" x1="374.62" y1="806.49" x2="265.38" y2="697.25"/>
                <line class="cls-1" x1="971.87" y1="320" x2="124.39" y2="320"/>
                <line class="cls-1" x1="955.61" y1="760" x2="108.13" y2="760"/>
            </svg>`;
            
            // Координаты для храмов
            const templeCoords = ['K6', 'J11', 'E10', 'F5'];
            // Координаты для тюрем  
            const jailCoords = ['N6', 'J14', 'B10', 'F2'];
            
            // Создаем храмы
            templeCoords.forEach(coord => {
                let cell = board.querySelector(`[data-coord="${coord}"]`);
                
                // Если ячейка не найдена, создаем невидимый контейнер
                if (!cell) {
                    cell = document.createElement('div');
                    cell.style.position = 'absolute';
                    cell.style.background = 'transparent';
                    cell.style.border = 'none';
                    cell.style.pointerEvents = 'none';
                    cell.dataset.coord = coord;
                    
                    const pos = coordToPosition(coord);
                    cell.style.left = pos.x + 'px';
                    cell.style.top = pos.y + 'px';
                    cell.style.width = 'calc(min(90vw, 600px) * 35 / 600)';
                    cell.style.height = 'calc(min(90vw, 600px) * 35 / 600)';
                    
                    board.appendChild(cell);
                }
                
                if (cell) {
                    const templeElement = document.createElement('div');
                    templeElement.className = 'temple-icon';
                    templeElement.innerHTML = templeSVG;
                    templeElement.title = 'Здесь фишка защищена от сбивания. Только одна фишка одновременно. Фишка может покинуть Храм в любой свой ход. Мимо фишек, зашедших в Храм, можно пройти.';
                    
                    // Добавляем обработчики для всплывающих подсказок
                    templeElement.addEventListener('mouseenter', function(e) {
                        if (selectedPiece === null) {
                            showTooltip(e, 'Здесь фишка защищена от сбивания. Только одна фишка одновременно. Фишка может покинуть Храм в любой свой ход. Мимо фишек, зашедших в Храм, можно пройти.');
                        }
                    });
                    
                    templeElement.addEventListener('mouseleave', function() {
                        hideTooltip();
                    });
                    
                    cell.appendChild(templeElement);
                }
            });
            
            // Создаем тюрьмы
            jailCoords.forEach(coord => {
                let cell = board.querySelector(`[data-coord="${coord}"]`);
                
                // Если ячейка не найдена, создаем невидимый контейнер
                if (!cell) {
                    cell = document.createElement('div');
                    cell.style.position = 'absolute';
                    cell.style.background = 'transparent';
                    cell.style.border = 'none';
                    cell.style.pointerEvents = 'none';
                    cell.dataset.coord = coord;
                    
                    const pos = coordToPosition(coord);
                    cell.style.left = pos.x + 'px';
                    cell.style.top = pos.y + 'px';
                    cell.style.width = 'calc(min(90vw, 600px) * 35 / 600)';
                    cell.style.height = 'calc(min(90vw, 600px) * 35 / 600)';
                    
                    board.appendChild(cell);
                }
                
                if (cell) {
                    const jailElement = document.createElement('div');
                    jailElement.className = 'jail-icon';
                    jailElement.innerHTML = jailSVG;
                    jailElement.title = 'Тюрьма: Попав сюда, вы «застряли». Чтобы выйти, нужно выбросить хотя бы одну 6 - это плата за выход, а вторая кость укажет, на сколько шагов вы двигаетесь. На этом поле может находиться только одна фишка одновременно. Фишка защищена от сбивания, мимо фишки в тюрьме можно пройти.';
                    
                    // Добавляем обработчики для всплывающих подсказок
                    jailElement.addEventListener('mouseenter', function(e) {
                        if (selectedPiece === null) {
                            showTooltip(e, 'Тюрьма: Попав сюда, вы «застряли». Чтобы выйти, нужно выбросить хотя бы одну 6 - это плата за выход, а вторая кость укажет, на сколько шагов вы двигаетесь. На этом поле может находиться только одна фишка одновременно. Фишка защищена от сбивания, мимо фишки в тюрьме можно пройти.');
                        }
                    });
                    
                    jailElement.addEventListener('mouseleave', function() {
                        hideTooltip();
                    });
                    
                    cell.appendChild(jailElement);
                }
            });
        }

        function createTeleportIcons() {
            const board = document.getElementById('game-board');
            if (!board) return;
            
            const teleportSVG = `<svg id="_Слой_2" data-name="Слой 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080">
                <path class="teleport-path" d="M866.57,852.97c-244.78,120.03-517.09,49.7-623.37-119.8-70.66-112.68-71.2-274.38,16.19-398.05,80.05-113.28,230.86-190.36,380.5-162.31,24.28,4.55,195.35,36.62,238.83,181.63,30.83,102.84-16.59,215.55-105.25,274.38-103.07,68.4-267.23,67.53-340.02-27.05-53.8-69.91-58.76-192.41,16.19-251.19,61.05-47.88,177.25-55.16,214.54,3.86,25.09,39.72,10.64,103.46-36.43,154.58"/>
            </svg>`;

            const teleportConfig = [
                { coord: 'I7', color: '#ff4444', player: 1 }, // Красный
                { coord: 'G9', color: '#FFD700', player: 2 }, // Желтый
                { coord: 'I9', color: '#228B22', player: 3 }, // Зеленый
                { coord: 'G7', color: '#8A2BE2', player: 4 }  // Фиолетовый
            ];

            // Отображаем телепорты только для активных игроков
            teleportConfig.filter(config => config.player <= playerCount).forEach(config => {
                let cell = board.querySelector(`[data-coord="${config.coord}"]`);
                if (!cell) {
                    cell = document.createElement('div');
                    cell.className = 'cell';
                    cell.dataset.coord = config.coord;
                    
                    const pos = coordToPosition(config.coord);
                    cell.style.position = 'absolute';
                    cell.style.left = pos.x + 'px';
                    cell.style.top = pos.y + 'px';
                    cell.style.width = '35px';
                    cell.style.height = '35px';
                    
                    board.appendChild(cell);
                }

                const teleportElement = document.createElement('div');
                teleportElement.innerHTML = teleportSVG;
                // Адаптивный размер: 80% от размера клетки (как храмы и тюрьмы)
                const cellSize = window.innerWidth <= 768
                    ? `calc(100vw / 15 * 0.8)`
                    : `calc(min(90vw, 600px) * 35 / 600 * 0.8)`;

                teleportElement.style.cssText = `
                    position: absolute;
                    width: ${cellSize};
                    height: ${cellSize};
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    pointer-events: auto;
                    z-index: 5;
                `;
                
                // Применяем цвет к SVG
                const pathElement = teleportElement.querySelector('.teleport-path');
                if (pathElement) {
                    pathElement.style.fill = 'none';
                    pathElement.style.stroke = config.color;
                    pathElement.style.strokeWidth = '50px';
                    pathElement.style.strokeLinecap = 'round';
                    pathElement.style.strokeLinejoin = 'round';
                }

                // Добавляем всплывающую подсказку
                const tooltipText = 'Телепорт: Позволяет на следующем ходу переместиться в телепорт другого игрока: на 1 на кубике – следующий по часовой стрелке, на 3 - напротив, на 6 - следующий против часовой стрелки (ближний к дому). Доступно только из телепорта своего цвета.';
                teleportElement.title = tooltipText;
                
                // Добавляем обработчики для всплывающих подсказок
                teleportElement.addEventListener('mouseover', function(e) {
                    if (selectedPiece === null) {
                        showTooltip(e, tooltipText);
                    }
                });
                teleportElement.addEventListener('mouseout', function() {
                    hideTooltip();
                });

                cell.appendChild(teleportElement);
            });
        }

        function createHomeIcons() {
            const board = document.getElementById('game-board');
            if (!board) return;

            // SVG из файла дом.svg
            const homeSVG = `<svg width="225" height="225" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 225 225">
                <g>
                    <title>Layer 1</title>
                    <rect class="home-rect" transform="rotate(135 169.523 60.6687)" stroke="null" id="svg_9" height="154.9685" width="12" y="-16.81559" x="163.52322" fill="#000000"/>
                    <rect class="home-rect" transform="rotate(45 62.1397 59.4509)" stroke="null" id="svg_10" height="162.27469" width="12" y="-21.68647" x="56.13972" fill="#000000"/>
                    <rect class="home-rect" stroke="null" id="svg_11" height="133.79764" width="12" y="90.98392" x="23.0398" fill="#000000"/>
                    <rect class="home-rect" id="svg_12" height="134" width="12" y="90.98392" x="193.94538" stroke="null" fill="#000000"/>
                    <rect class="home-rect" id="svg_13" height="12" width="178.22264" y="213.09539" x="23.38823" stroke="null" fill="#000000"/>
                    <rect class="home-rect" id="svg_14" height="95.29598" width="12" y="121.58432" x="47.67534" fill="#000000"/>
                    <rect class="home-rect" stroke="null" id="svg_15" height="12" width="53.48195" y="121.78866" x="49.52235" fill="#000000"/>
                    <rect class="home-rect" stroke="null" id="svg_17" height="56.98814" width="14.99915" y="3.67401" x="163.3073" fill="#000000"/>
                    <rect class="home-rect" transform="rotate(135 173.161 48.9787)" id="svg_18" height="35.8423" width="9" y="31.05753" x="168.66093" stroke="null" fill="none"/>
                    <rect class="home-rect" id="svg_19" height="50" width="12" y="111.50541" x="131.87666" stroke="null" fill="#000000"/>
                    <rect class="home-rect" id="svg_29" height="50" width="12" y="111.01097" x="170.18025" stroke="null" fill="#000000"/>
                    <rect class="home-rect" id="svg_30" height="12" width="50" y="110.69749" x="131.93574" stroke="null" fill="#000000"/>
                    <rect class="home-rect" stroke="null" id="svg_31" height="12" width="50" y="149.56916" x="131.93574" fill="#000000"/>
                    <rect class="home-rect" id="svg_32" height="94.98433" width="12" y="121.66928" x="91.18339" stroke="null" fill="#000000"/>
                </g>
            </svg>`;

            // Конфигурация домов с координатами финишных зон и цветами, соответствующими телепортам
            const homeConfig = [
                { coords: ['H2', 'H3', 'H4', 'H5', 'H6'], color: '#fcacac', player: 1 },      // Красный
                { coords: ['H14', 'H13', 'H12', 'H11', 'H10'], color: '#ffd93d', player: 2 }, // Желтый
                { coords: ['N8', 'M8', 'L8', 'K8', 'J8'], color: '#6bcf7f', player: 3 },      // Зеленый
                { coords: ['B8', 'C8', 'D8', 'E8', 'F8'], color: '#c4b3f5', player: 4 }       // Фиолетовый
            ];

            const playerNames = ['Красного', 'Желтого', 'Зеленого', 'Фиолетового'];

            // Отображаем дома только для активных игроков
            homeConfig.filter(config => config.player <= playerCount).forEach(config => {
                config.coords.forEach(coord => {
                    let cell = board.querySelector(`[data-coord="${coord}"]`);

                    // Если ячейка не найдена, создаем невидимый контейнер
                    if (!cell) {
                        cell = document.createElement('div');
                        cell.style.position = 'absolute';
                        cell.style.background = 'transparent';
                        cell.style.border = 'none';
                        cell.style.pointerEvents = 'none';
                        cell.dataset.coord = coord;

                        const pos = coordToPosition(coord);
                        cell.style.left = pos.x + 'px';
                        cell.style.top = pos.y + 'px';
                        cell.style.width = 'calc(min(90vw, 600px) * 35 / 600)';
                        cell.style.height = 'calc(min(90vw, 600px) * 35 / 600)';

                        board.appendChild(cell);
                    }

                    if (cell) {
                        const homeElement = document.createElement('div');
                        homeElement.className = 'home-icon';
                        homeElement.innerHTML = homeSVG;

                        // Применяем цвет игрока ко всем rect элементам SVG
                        const rects = homeElement.querySelectorAll('.home-rect');
                        rects.forEach(rect => {
                            if (rect.getAttribute('fill') !== 'none') {
                                rect.style.fill = config.color;
                            }
                        });

                        // Добавляем подсказку
                        const tooltipText = 'Дом — финальные клетки вашего пути. Заведите сюда все свои фишки, чтобы победить. Войти можно только в дом своего цвета.';
                        homeElement.title = tooltipText;

                        // Добавляем обработчики для всплывающих подсказок
                        homeElement.addEventListener('mouseenter', function(e) {
                            if (selectedPiece === null) {
                                showTooltip(e, tooltipText);
                            }
                        });

                        homeElement.addEventListener('mouseleave', function() {
                            hideTooltip();
                        });

                        cell.appendChild(homeElement);
                    }
                });
            });
        }
		
		        // Функция для очистки подсказок ходов
		function clearMoveHints() {
            // Удаляем все подсказки
            document.querySelectorAll('.move-hint').forEach(hint => hint.remove());
            document.querySelectorAll('.possible-move').forEach(cell => {
                cell.classList.remove('possible-move');
            });

            // НЕ очищаем кеш здесь автоматически, так как кеш может использоваться
            // для валидации в performMove(). Кеш очищается только при смене состояния игры.
        }
		// Функция для получения текущей позиции фишки
        function getPiecePosition(piece) {
            const startZones = Object.values(START_ZONES).flat();
            const waitingZones = Object.values(WAITING_ZONES).flat();
            const currentCoord = getCurrentPosition(piece);
            
            if (!currentCoord) {
                return {type: 'unknown', coord: null};
            }
            
            if (startZones.includes(currentCoord)) {
                return {type: 'start', coord: currentCoord};
            }
            
            if (waitingZones.includes(currentCoord)) {
                return {type: 'waiting', coord: currentCoord};
            }
            
            return {type: 'board', coord: currentCoord};
        }
		        // Функция для выделения фишки
        function selectPiece(piece) {
            // Убрать выделение с предыдущей фишки
            if (selectedPiece) {
                selectedPiece.classList.remove('selected');
            }

            // Выделить новую фишку
            selectedPiece = piece;
            if (piece) {
                piece.classList.add('selected');
            }
        }
		function showTooltip(event, text) {
            hideTooltip(); // Скрыть предыдущую подсказку
            
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = text;
            
            document.body.appendChild(tooltip);
            
            // Позиционирование подсказки
            const rect = event.target.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            
            let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
            let top = rect.top - tooltipRect.height - 10;
            
            // Проверка границ экрана
            if (left < 10) left = 10;
            if (left + tooltipRect.width > window.innerWidth - 10) {
                left = window.innerWidth - tooltipRect.width - 10;
            }
            if (top < 10) {
                top = rect.bottom + 10;
            }
            
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
            
            // Показать подсказку
            requestAnimationFrame(() => {
                tooltip.classList.add('show');
            });
            
            currentTooltip = tooltip;
        }
		
		function hideTooltip() {
            if (currentTooltip) {
                currentTooltip.remove();
                currentTooltip = null;
            }
        }