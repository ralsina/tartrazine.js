int func1(int x, int y)
    /*@requires y >= 0*/
{
    return x / y;
}


int func2(int x, int y)    //@requires y >= 0;
{
    return x / y;
}


void func3()
//#test{};
{
    fun(2,3)//test1;
    ;
}


int func4(int x, int y)
    /*@requires y >= 0;*/
{
    return x / y;
}


int func5(int x, int y)
    /*@requires y >= 0
    {
        return x / y;
    }
    */
   {
       return 2;
   }


//@requires y >= 0;
//@requires y >= 0
/*
calling(2,5)
*/
/*
calling(2,5);
*/
int func6(int x, int y)
    //@requires y >= 0
    //@requires y >= 0;
    /*
    hello(2,3);
    */
    /*
    hello(2,3)
    */
    {
        // haha(2,3);
        return x / y;
        /*
        callblabla(x, y);
        */
    }
//@requires y >= 0;
//@requires y >= 0
/*
calling(2,5)
*/
/*
calling(2,5);
*/


int * //@# a pointer to int
func7 /* @# why a comment here?  */ (
  int /* the index has to be an int */ a, // index into the array
  int *b    //the array @!
)
/*
    The end of the func params @ (@ will result error if parsed incorrectly)
*/
{
  // yet another comment
  return b[a];
}