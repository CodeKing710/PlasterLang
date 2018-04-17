//
//  compiler.cpp
//  PlasterLang
//
//  Created by Carter Ervin on 3/24/18.
//  Copyright © 2018 N@W. All rights reserved.
//
//  Takes Plaster source code and optimised code and runs it

#include <stdio.h>
#include <cstring>

//Check includes
#ifndef linker_h
#include "linker.h"
#endif
#ifndef lexer_h
#include "lexer.h" //Should immediately pull in literals too
#include "literals.h"
#endif
#ifndef prepro_h
#include "prepro.h"
#endif
#ifndef parser_h
#include "parser.h"
#endif
#ifndef opti_h
#include "opti.h"
#endif
#ifndef err_h
#include "err.h"
#endif

int main(int argc, const char * argv[]) {
    //TEST CODE
    if(argc == 1) {
        Array args;
        //We have one argument, let's check what it is
        for(int i = 0; i < sizeof(*argv); i++) {
            //Generate correct objects, then array
            
        };
    };
    //FINISH CLEAR IF ALL GOES WELL, EXIT CODES DEFINED IN README AND COMMENTS
    return 0;
}
