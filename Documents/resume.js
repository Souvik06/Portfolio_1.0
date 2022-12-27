function printpage() {
    //Get the print button and put it into a variable
    var printButton = document.getElementById("printpagebutton");
    //Set the print button visibility to 'hidden' 
    printButton.style.visibility = 'hidden';
    //Print the page content
    window.print()
    //Set the print button to 'visible' again 
    //[Delete this line if you want it to stay hidden after printing]
    printButton.style.visibility = 'visible';
}