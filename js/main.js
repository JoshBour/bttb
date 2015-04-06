$(function () {
    var bTable = $('.tableWrapper').betterTable({
        unsortableColumns : [1,14],
        hiddenColumns : [1],
        tableName : "Workers",
        lengthMenu : [1,5,7,10,20,30,-1],
        defaultLength : 1,
        columnNumber : 50,
        saveLocation : "/save"
    });

    //console.log(bTable.getColumns());
});