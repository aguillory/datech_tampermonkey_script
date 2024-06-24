// ==UserScript==
// @name         Sort Table and Hide unwanted projects
// @namespace    http://tampermonkey.net/
// @version      2024-06-10
// @description  Sorts table based on custom rules and hides rows containing unwanted keywords
// @author       Alyssa + AI
// @match      https://app.dataannotation.tech/workers/projects
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==
(function() {
    'use strict';
	//////////////// DEFINITION SECTION ////////////////
    // Constants
    const KEYWORDS_STORAGE_KEY = 'keywords';

    // Get the list of keywords from storage
    let keywords = GM_getValue(KEYWORDS_STORAGE_KEY, []);


	//////////////// CREATE CONTAINERS ////////////////
	// Create the main container
    let container = createContainer();

    // Create the keyword box
    let keywordBox = createKeywordBox(keywords);
    container.appendChild(keywordBox);

    // Add the container to the page
    let mainContainer = document.querySelector('.tw-mt-8');
    if (mainContainer) {
        mainContainer.insertBefore(container, mainContainer.firstChild);
	}

	//////////////// FUNCTION TO HIDE ROWS ////////////////
    // Function to hide rows containing unwanted keywords
    function hideRows() {
        // Get all TRs on the page
        let trs = document.querySelectorAll('tr');

        // Loop through each TR
        trs.forEach(function(tr) {
            // Check if the TR contains any of the unwanted keywords
            let hide = false;
            keywordBox.querySelectorAll('li').forEach(function(keywordItem) {
                let keywordCheckbox = keywordItem.querySelector('input');
                let keywordText = keywordItem.querySelector('span').textContent;
                if (keywordCheckbox.checked) {
                    // Check each TD in the TR
                    tr.querySelectorAll('td').forEach(function(td) {
                        if (td.textContent.includes(keywordText)) {
                            hide = true;
						}
					});
				}
			});
            if (hide) {
                // Hide the entire row
                tr.style.display = 'none';
				} else {
                // Show the entire row
                tr.style.display = '';
			}
		});
	}
	//////////////// FUNCTION TO REORGANIZE TABLE ////////////////
// Function to reorganize the table
function reorganizeTable() {
    const tables = document.querySelectorAll('.sc-aXZVg.kShpri'); // select all table elements
    tables.forEach((table, index) => {
        // hide the 4th column (Created)
        table.querySelectorAll('th:nth-child(4), td:nth-child(4)').forEach((cell) => {
            cell.style.display = 'none';
        });

        // swap the Pay and Name columns
        table.querySelectorAll('th:nth-child(1), td:nth-child(1)').forEach((cell) => {
            const nextCell = cell.nextElementSibling;
            cell.parentNode.insertBefore(nextCell, cell);
        });
    });
}

//////////////// FUNCTION TO SORT TABLE ////////////////
// Function to sort the table
function sortTable() {
    const tables = document.querySelectorAll('.sc-aXZVg.kShpri'); // select all table elements
    tables.forEach((table, index) => {
        const rows = Array.from(table.querySelectorAll('tbody tr')); // get all table rows

        // sort the rows
        rows.sort((a, b) => {
            const payCellA = a.querySelector('td:nth-child(1)');
            const payCellB = b.querySelector('td:nth-child(1)');
            const payA = payCellA.textContent.trim();
            const payB = payCellB.textContent.trim();

            // if either pay value is empty, sort it to the bottom
            if (payA === '') return 1;
            if (payB === '') return -1;

            // if tasks are under 5, sort to the bottom
            const taskCellA = a.querySelector('td:nth-child(3)');
            const taskCellB = b.querySelector('td:nth-child(3)');
            const tasksA = parseInt(taskCellA.textContent.trim());
            const tasksB = parseInt(taskCellB.textContent.trim());
            if (tasksA < 10) return 1;
            if (tasksB < 10) return -1;

            // sort by dollar value without /hr first
            if (payA.includes('/hr')) {
                if (!payB.includes('/hr')) return 1;
            } else {
                if (payB.includes('/hr')) return -1;
            }

            // sort by yellow star icon second
            const starCellA = a.querySelector('td:nth-child(5) svg');
            const starCellB = b.querySelector('td:nth-child(5) svg');
            if (starCellA.classList.contains('tw-fill-yellow-400')) {
                if (!starCellB.classList.contains('tw-fill-yellow-400')) return -1;
            } else {
                if (starCellB.classList.contains('tw-fill-yellow-400')) return 1;
            }

            // sort by pay value third (descending)
            const payValueA = parseFloat(payA.replace('$', '').replace('/hr', ''));
            const payValueB = parseFloat(payB.replace('$', '').replace('/hr', ''));
            return payValueB - payValueA;
        });

        // update the table with the sorted rows
        const tbody = table.querySelector('tbody');
        rows.forEach((row) => {
            tbody.appendChild(row);
        });
    });
}
    // Function to add a button to each row to hide it
    function addHideButton() {
        const rows = document.querySelectorAll('tr');
        rows.forEach((row) => {
            const hideButton = document.createElement('button');
            hideButton.textContent = 'Hide';
            hideButton.onclick = function() {
                const keywordCell = row.querySelector('td:nth-child(2)');
                const keyword = keywordCell.textContent.trim();
                keywords.push(keyword);
                GM_setValue(KEYWORDS_STORAGE_KEY, keywords);
                row.style.display = 'none'; // instantly hide the row
                // Update the keyword list
                let keywordItem = document.createElement('li');
                keywordItem.style.marginBottom = '5px';
                let keywordCheckbox = document.createElement('input');
                keywordCheckbox.type = 'checkbox';
                keywordCheckbox.checked = true;
                keywordCheckbox.onchange = function() {
                    hideRows();
				};
                keywordItem.appendChild(keywordCheckbox);
                let keywordText = document.createElement('span');
                keywordText.textContent = keyword;
                keywordText.style.marginLeft = '5px';
                keywordItem.appendChild(keywordText);
                let keywordRemove = document.createElement('button');
                keywordRemove.textContent = ' X ';
                keywordRemove.style.fontWeight = 'bold';
                keywordRemove.style.marginLeft = '5px';
                keywordRemove.onclick = function() {
                    // Remove the keyword from the list
                    keywords.splice(keywords.indexOf(keyword), 1);
                    GM_setValue(KEYWORDS_STORAGE_KEY, keywords);
                    keywordItem.remove();
                    hideRows();
				};
                keywordItem.appendChild(keywordRemove);
                keywordBox.querySelector('ul').appendChild(keywordItem);
			};
            row.appendChild(hideButton);
		});
	}

	//////////////// FUNCTIONS RELATING TO MAKING BOXES ////////////////
    // Create the main container
    function createContainer() {
        let container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'row';
        container.style.justifyContent = 'space-between';
        container.style.marginBottom = '10px';
        return container;
	}

    // Create the keyword box
    function createKeywordBox(keywords) {
        let keywordBox = document.createElement('div');
        keywordBox.style.background = 'white';
        keywordBox.style.padding = '10px';
        keywordBox.style.border = '1px solid black';
        keywordBox.style.width = '30%';
        keywordBox.style.marginRight = '10px';

        let keywordHeading = document.createElement('h2');
        keywordHeading.textContent = 'Keywords to Hide';
        keywordBox.appendChild(keywordHeading);

        let keywordList = document.createElement('ul');
        keywordList.style.listStyle = 'none';
        keywordList.style.padding = '0';
        keywordList.style.margin = '0';
        keywords.forEach(function(keyword) {
            let keywordItem = document.createElement('li');
            keywordItem.style.marginBottom = '5px';
            let keywordCheckbox = document.createElement('input');
            keywordCheckbox.type = 'checkbox';
            keywordCheckbox.checked = true;
            keywordCheckbox.onchange = function() {
                hideRows();
			};
            keywordItem.appendChild(keywordCheckbox);
            let keywordText = document.createElement('span');
            keywordText.textContent = keyword;
            keywordText.style.marginLeft = '5px';
            keywordItem.appendChild(keywordText);
            let keywordRemove = document.createElement('button');
            keywordRemove.textContent = ' X ';
            keywordRemove.style.fontWeight = 'bold';
            keywordRemove.style.marginLeft = '5px';
            keywordRemove.onclick = function() {
                // Remove the keyword from the list
                keywords.splice(keywords.indexOf(keyword), 1);
                GM_setValue(KEYWORDS_STORAGE_KEY, keywords);
                keywordItem.remove();
                hideRows();
			};
            keywordItem.appendChild(keywordRemove);
            keywordList.appendChild(keywordItem);
		});
        keywordBox.appendChild(keywordList);

		let keywordInputContainer = document.createElement('div');
		keywordInputContainer.style.display = 'flex';
		keywordInputContainer.style.flexDirection = 'row';
		keywordInputContainer.style.alignItems = 'center';
		let keywordInput = document.createElement('input');
		keywordInput.type = 'text';
		keywordInput.placeholder = 'Add keyword';
		keywordInput.style.width = '80%';
		keywordInput.style.marginTop = '10px';
		keywordInput.onkeypress = function(event) {
			if (event.key === 'Enter') {
				// Add the new keyword to the list
				let newKeyword = keywordInput.value.trim();
				if (newKeyword !== '' && keywords.indexOf(newKeyword) === -1) {
					keywords.push(newKeyword);
					GM_setValue(KEYWORDS_STORAGE_KEY, keywords);
					let keywordItem = document.createElement('li');
					keywordItem.style.marginBottom = '5px';
					let keywordCheckbox = document.createElement('input');
					keywordCheckbox.type = 'checkbox';
					keywordCheckbox.checked = true;
					keywordCheckbox.onchange = function() {
						hideRows();
					};
					keywordItem.appendChild(keywordCheckbox);
					let keywordText = document.createElement('span');
					keywordText.textContent = newKeyword;
					keywordText.style.marginLeft = '5px';
					keywordItem.appendChild(keywordText);
					let keywordRemove = document.createElement('button');
					keywordRemove.textContent = ' X ';
					keywordRemove.style.fontWeight = 'bold';
					keywordRemove.style.marginLeft = '5px';
					keywordRemove.onclick = function() {
						// Remove the keyword from the list
						keywords.splice(keywords.indexOf(newKeyword), 1);
						GM_setValue(KEYWORDS_STORAGE_KEY, keywords);
						keywordItem.remove();
						hideRows();
					};
					keywordItem.appendChild(keywordRemove);
					keywordList.appendChild(keywordItem);
					hideRows();
				}
				keywordInput.value = '';
			}
		};
		keywordInputContainer.appendChild(keywordInput);
		let keywordAddButton = document.createElement('button');
		keywordAddButton.textContent = 'Add';
		keywordAddButton.style.width = '20%';
		keywordAddButton.style.marginTop = '10px';
		keywordAddButton.onclick = function() {
			let newKeyword = keywordInput.value.trim();
			if (newKeyword !== '' && keywords.indexOf(newKeyword) === -1) {
				keywords.push(newKeyword);
				GM_setValue(KEYWORDS_STORAGE_KEY, keywords);
				let keywordItem = document.createElement('li');
				keywordItem.style.marginBottom = '5px';
				let keywordCheckbox = document.createElement('input');
				keywordCheckbox.type = 'checkbox';
				keywordCheckbox.checked = true;
				keywordCheckbox.onchange = function() {
					hideRows();
				};
				keywordItem.appendChild(keywordCheckbox);
				let keywordText = document.createElement('span');
				keywordText.textContent = newKeyword;
				keywordText.style.marginLeft = '5px';
				keywordItem.appendChild(keywordText);
				let keywordRemove = document.createElement('button');
				keywordRemove.textContent = ' X ';
				keywordRemove.style.fontWeight = 'bold';
				keywordRemove.style.marginLeft = '5px';
				keywordRemove.onclick = function() {
					// Remove the keyword from the list
					keywords.splice(keywords.indexOf(newKeyword), 1);
					GM_setValue(KEYWORDS_STORAGE_KEY, keywords);
					keywordItem.remove();
					hideRows();
				};
				keywordItem.appendChild(keywordRemove);
				keywordList.appendChild(keywordItem);
				hideRows();
			}
			keywordInput.value = '';
		};
		keywordInputContainer.appendChild(keywordAddButton);
		keywordBox.appendChild(keywordInputContainer);

		return keywordBox;
	}

	//////////////// ACTUALLY DO STUFF ////////////////
    // Reorganize the table
    setTimeout(reorganizeTable, 500);

    // Hide rows containing unwanted keywords
    setTimeout(hideRows, 500);

    // Sort the table
    setTimeout(sortTable, 500);

    // Add a button to each row to hide it
    setTimeout(addHideButton, 500);
})();
