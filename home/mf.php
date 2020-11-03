<?php

function mail_attachment($to, $subject, $message, $from)
{
  $uid = md5(uniqid(time()));
  $header = "From: ".$from."\r\n"
      ."MIME-Version: 1.0\r\n"
      ."Content-Type: multipart/mixed; boundary=\"".$uid."\"\r\n\r\n"
      ."This is a multi-part message in MIME format.\r\n" 
      ."--".$uid."\r\n"
      ."Content-type:text/plain; charset=iso-8859-1\r\n"
      ."Content-Transfer-Encoding: 7bit\r\n\r\n"
      .$message."\r\n\r\n"
      ."--".$uid."\r\n";
  return mail($to, $subject, "", $header,"-f $from");
}


$allok = true;
if ((!isset($_POST)) || (!isset($_POST['email'])) || (!isset($_POST['name'])) || (!isset($_POST['nachricht'])))
{
	$allok = false;
}

if ($allok)
{
	$msg .= "Email-Anfrage von w3geo.at\n------------------------------------------------------------\n";
	foreach ($_POST as $rk => $rv)
	{
		$msg .= "$rk:\t\t$rv\n";
	}
	mail_attachment('info@w3geo.at','Anfrage von w3geo.at', utf8_decode($msg), $_POST['email']);
} else
{
	header('HTTP/1.0 403 Forbidden');
	echo "FORBIDDEN!";
}



?>