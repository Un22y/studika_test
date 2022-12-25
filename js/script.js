const url = new URL('https://studika.ru/api/areas');

//темплейт бейджика
const choiseArea = document.querySelector('#choise-template').content;

// константы мобильного меню

    // открыть мобильное меню
const sidebarButton = document.querySelector('#hamburger');

    // fixed-контейнер для затемнения и окна мобильного меню
const sidebarContainer = document.querySelector('.mobile-menu-container');

    // затемненный фон
const overlay = sidebarContainer.querySelector('.mobile-menu-overlay');

    //  мобильное меню
const menu = sidebarContainer.querySelector('.mobile-menu-content');

//  кнопки выбора типа образования
    // высшее
const hightEdButton = menu.querySelector('[data-type=menu-hight]');

    // среднее
const middleEdButton = menu.querySelector('[data-type=menu-middle]');

// соответственно, меню для каждого типа выбора
    // высшее
const hightEdMenu = menu.querySelector(`#${hightEdButton.dataset.type}`);

    // среднее
const middleEdMenu = menu.querySelector(`#${middleEdButton.dataset.type}`);


// константы окна поиска

    // кнопка открытия/закрытия окна поиска
const searchButton = document.querySelector('#city-search-button');

    // окно поиска
const searchDisplay = document.querySelector('#city-search-window');
    
    // вывод выбранных регионов
const choisedCities = document.querySelector('.search-choised');

    // кнопка очистки инпута
const searchClear = searchDisplay.querySelector('.city-search-clear');

    // инпут поиска
const searchInput = searchDisplay.querySelector('.city-search');

    // список городов
const suggestions = searchDisplay.querySelector('.all-city-loaded');

    // список выбранных "бейджиков"
const selectedArea = searchDisplay.querySelector('.city-selected');
 
    // кнопка сохранения списка поиска
const saveButton = searchDisplay.querySelector('#save-search-list');


// функции для удобства работы с dom-деревом
// создание элемента, его вставка, очистка, удаление элемента из массива
function append(parent, el) {
    return parent.appendChild(el);
}

function createNode(element) {
    return document.createElement(element);
}

const removeArrayElement = (array, value) => {
    return array.filter(el => el.id != value); 
}


function clearPage(placeWhereDelete, classToDelete) {
    let listToDelete = placeWhereDelete.querySelectorAll(classToDelete);
    listToDelete.forEach(e => e.remove());
}


// ловим данные в массив и возвращаем его
async function getData() {
    const array = [];
    const response = await fetch(url,{
        method:'POST',
    });
    const result = await response.json();
    array.push(...result);
    return array;
}

// ищем города по объектам областей
// в тз был указан путь api только к регионам, не к городам
// нашел выход в функции getCities, и сложением двух массивов
function getCities(array) {
    const citiesList = []
    array.forEach(element => {
        if (element.type === 'area')
            citiesList.push(...element.cities);
    });
    return citiesList;
}


async function main() {
    const cookieName = 'search'
    const areas = await getData(); // массив областей
    const cities = getCities(areas); // массив городов
    const data = areas.concat(cities); // общий массив регионов и городов
    data.sort((a,b) => Number(a.id) - Number(b.id)); // отсортировал массив по id
    
    let choiseList = []; // массив выбранных городов

    // находим по массиву строк из полученного куки нужные объекты
    function getCookiesList(array) {
        return array.map(item => {
            return data.find((el) => el.name == item);
        });

    }


    // проверям куки
    if (document.cookie) {
        let request = document.cookie.slice(cookieName.length+1);
        choisedCities.textContent = request;
        let requestList = request.split(', ');
        //заполняем список объектов
        choiseList.push(...getCookiesList(requestList));
        console.log(choiseList);
        //создаем бейджики 
        choiseList.forEach(choise => createChoiseItem(choise));
    } else {
        choisedCities.textContent = 'Любой регион';
    }
        

    // рисуем изначальный список по массиву 
    data.forEach(area => {
        const item = createListItem(area);
        append(suggestions, item);
    });


    // обработчик открытия окна и запуск анимации
    searchButton.addEventListener('click', () => {
        if (searchDisplay.classList.contains('.active')) {
            searchDisplay.classList.add('closed');
            setTimeout(() => 
                searchDisplay.classList.toggle('active')
            ,500)
        } else {
            searchDisplay.classList.toggle('active');
            searchDisplay.classList.remove('closed');
        }
        
    });


    // обработчик закрытия окна поиска
    // обошел стороной stopPropagnation в пользу composedPath от элемента события
    window.addEventListener('click', (e) => {
        let withinBoundaries = e.composedPath().includes(searchButton);
        if (!withinBoundaries) {
            if (!e.composedPath().includes(searchDisplay)) {
                if(!searchDisplay.classList.contains('.closed')){
                    searchDisplay.classList.add('closed');
                    searchDisplay.classList.remove('active');
                } else {
                    searchDisplay.classList.toggle('active');
                }
            }
        }
    })

    // обработчики зажатой клавиши и изменения инпута
    searchInput.addEventListener('change', displayMathes);
    searchInput.addEventListener('keyup', displayMathes);
    
    // на основе нового массива городов отрисовываем
    // dom элементы
    function displayMathes() {
        clearPage(suggestions,'.city-item');
        const areaList = findMatches(this.value, data).map(place => {
            const regex1 = new RegExp(this.value, 'gi');
            const listItem = createListItem(place, regex1);
          return listItem;
        });
        areaList.forEach(match => {
            append(suggestions, match);
        })

    }

    // функция возвращает массив городов, отфильтрованных
    // по содержимому инпута
    function findMatches(wordToMatch, array) {
        wordToMatch != '' 
            ? searchClear.classList.add('active')
            : searchClear.classList.remove('active');
        return array.filter(place => {
            const regex = new RegExp(wordToMatch, 'gi');
            return place.name.match(regex);
        });
    }
    
    // удаление введенного текста в инпут
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        displayMathes();
        searchClear.classList.remove('active');
    })
    
    // создаем элемент списка, выделяем жирным тестом совпадение с инпутом
    // реализован поиск внутри слова
    // добавляем обработчик на добавление/удаление бейджика
    function createListItem(object, regex) {
        const nameMatch = object.name.match(regex);
        const name = createNode('span');
        searchInput.value == '' ? name.innerHTML = object.name // микрокостыль,
        // иначе регулярное выражение разносит текст внутри элемента в щепки 
        : name.innerHTML = object.name.replace(regex, `<b>${nameMatch}</b>`);
        const item = createNode('div');
        item.classList.add('city-item');

        item.dataset.id = object.id;
        // проверяем элемент списка на наличие в уже выбранных
        // и добавляем класс active
        if (choiseList.find(element => element.id == item.dataset.id))
            item.classList.add('active');
        append(item,name);
        if (object.state_id) {
            const stateName = createNode('span');
            stateName.classList.add('state-name');
            stateName.textContent = data.find(e => e.id == object.state_id).name;
            append(item, stateName);
        }
        item.addEventListener('click', switchChoise);
        return item;
    }

    // обработчик нажатия на элемент списка - удаляет элемент по проверке
    // на класс active
    function switchChoise() {
        const item = this;
        const choise = data.find(element => element.id == item.dataset.id);
        if (item.classList.contains('active')) {
            removeChoise(item); // удаление то же, что и по нажатию на кнопку бейджика 
        } else {
            createChoiseItem(choise);
            item.classList.toggle('active');
            choiseList.push(choise);
            
        }
    }
    

    // создаём "бейджик" при помощи template
    // и вешаем обработчик удаления на кнопку
    function createChoiseItem(data) {
        const item = choiseArea.cloneNode(true).querySelector('.city-select');
        const name = item.querySelector('.city-select-name');
        const closeButton = item.querySelector('.city-select-clear');
        closeButton.dataset.id = data.id;
        closeButton.addEventListener('click',() => {    
            removeChoise(closeButton);
        });
        item.dataset.index = data.id;
        name.textContent = data.name;
        append(selectedArea, item);
    }


    // удаление бейджика запускает анимацию затухания
    // и одновременно управляет классами бейджика и элемента списка
    function removeChoise(item) {
        const selectedItem = selectedArea.querySelector(`[data-index='${item.dataset.id}']`);
        const selectedList = suggestions.querySelector(`[data-id='${item.dataset.id}']`);
        selectedList.classList.toggle('active');
        selectedItem.classList.toggle('closed');
        choiseList = removeArrayElement(choiseList, selectedItem.dataset.index);
        setTimeout(() => {
            selectedItem.remove();
        },500);
    }
    
    
    // сохраняем наш список для отправки на бэк/отрисовки страницы
    // реализовал перезагрузку страницы после изменений в поиске и
    // обновляю строку в шапке
    saveButton.addEventListener('click', () => {
        if (choiseList.length == 0) {
            choisedCities.textContent = 'Любой регион';
            setCookie(cookieName, '', {'max-age': -1});
            location.reload();
        } else {
            const area = choiseList.map(element => element.name).join(', ');        
            choisedCities.textContent = area;
            setCookie(cookieName, area);
            console.log(area);
            location.reload();
        }
    });

    function setCookie(name, value, options = {}) {

        options = {
          path: '/',
          ...options
        };
      
        if (options.expires instanceof Date) {
          options.expires = options.expires.toUTCString();
        }
      
        let updatedCookie = name + "=" + value;
      
        for (let optionKey in options) {
          updatedCookie += "; " + optionKey;
          let optionValue = options[optionKey];
          if (optionValue !== true) {
            updatedCookie += "=" + optionValue;
          }
        }
      
        document.cookie = updatedCookie;
    }

    // ниже код по оживлению мобильного меню

    function openMenu() {
        menu.classList.remove('closed');
        overlay.classList.remove('closed');
        menu.classList.add('active');
        overlay.classList.add('active');
        sidebarContainer.classList.add('active');
    };

    hightEdButton.addEventListener('click', () => {
        hightEdMenu.classList.toggle('active');
        hightEdMenu.classList.toggle('closed');
        middleEdMenu.classList.toggle('active');
        middleEdMenu.classList.toggle('closed');
        hightEdButton.classList.toggle('active');
        middleEdButton.classList.toggle('active');
    });
    
    middleEdButton.addEventListener('click', () => {
        middleEdMenu.classList.toggle('active');
        middleEdMenu.classList.toggle('closed');
        hightEdMenu.classList.toggle('active');
        hightEdMenu.classList.toggle('closed');
        middleEdButton.classList.toggle('active');
        hightEdButton.classList.toggle('active');
    });
    
    
    
    
    sidebarButton.addEventListener('click', openMenu);
    overlay.addEventListener('click', (e) => {
        let withinBoundaries = e.composedPath().includes(menu);
        if (!withinBoundaries) {
            menu.classList.add('closed');
            overlay.classList.add('closed');
            overlay.classList.remove('active');
            menu.classList.remove('active');
            setTimeout(()=> {
                sidebarContainer.classList.remove('active');
            }, 500);
        }
    });

}

main();